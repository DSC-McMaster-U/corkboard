/* Jan 19th 2026
 * to run this file directly, use (from the backend directory)
 * `node --loader ts-node/esm src/scrapers/scraper.ts` 
 */

import { eventService } from "../services/eventService.js";
import { artistService } from "../services/artistService.js";
import { scrapeMillsHardware } from "./millshardware.js";
import { scrapeCorktownPub } from "./corktownpub.js";
import { scrapeBridgeworks } from "./bridgeworks.js";
import { scrapeMcIntyre } from "./mcintyre.js";
import { scrapeTDColiseum } from "./tdcoliseum.js";
import { genresService } from "../services/genresService.js";
import type { Event } from "../utils/types.js";


export async function insertScrapedEvents(events: Event[], venueID: string) {
  function normalizeTitle(s: string) {
    return s.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }

  function dateOnlyKey(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function makeKey(venue_id: string, startTime: Date, title: string) {
    return `${venue_id}|${dateOnlyKey(startTime)}|${normalizeTitle(title)}`;
  }

  if (!events.length) return;

  const minDate = new Date(Math.min(...events.map(e => e.start_time.getTime())));
  minDate.setDate(minDate.getDate() - 2);
  minDate.setHours(0, 0, 0, 0);

  const maxDate = new Date(Math.max(...events.map(e => e.start_time.getTime())));
  maxDate.setDate(maxDate.getDate() + 2);
  maxDate.setHours(23, 59, 59, 999);

  const existing = await eventService.getEventsForVenueInRange(
    venueID,
    minDate.toISOString(),
    maxDate.toISOString()
  );

  type ExistingEventRow = {
    id: string;
    venue_id: string;
    start_time: string;
    title: string;
    description: string | null;
    cost: number | null;
    source_url: string | null;
    artist_id: string | null;
    image: string | null;
    status: string | null;
    source_type: string | null;
    ingestion_status: string | null;
    event_genres: { genres: any }[] | null;
  };

  const existingByKey = new Map<string, ExistingEventRow>(); // key -> event row
  for (const e of existing as ExistingEventRow[]) {
    const key = makeKey(e.venue_id, new Date(e.start_time), e.title);
    existingByKey.set(key, e);
  }

  const now = new Date();

  for (const event of events) {
    const startIso = event.start_time.toISOString();
    const k = makeKey(venueID, event.start_time, event.title);

    // don't add events that aren't in the future
    if (event.start_time <= now) {
      console.log(`Skipping past event: ${event.title} (${event.start_time.toISOString()})`);
      continue;
    }

    // check if artist exists, if not create, pass new artist id to event
    const artistRecord = await artistService.getOrCreateArtistByName(event.artist || event.title);
    const artistID = artistRecord?.id ?? null;

    // if exists, update it
    const existingRow = existingByKey.get(k);
    const patch = {
      title: event.title,
      venue_id: venueID,
      start_time: startIso,
      description: normalizeNullableString(event.description),
      cost: event.cost ?? null,
      status: "published" as const,
      source_type: "scraping" as const,
      source_url: normalizeNullableString(event.source_url),
      ingestion_status: "success" as const,
      artist_id: artistID,
      image: normalizeNullableString(event.image),
      genreIds: [] as string[],
    };

    const genreIDs = [];
    if (event.genres?.length) {
      for (const gName of event.genres) {
        const g = await genresService.getOrCreateByName(gName);
        if (g?.id) genreIDs.push(g.id);
      }
    }
    patch.genreIds = genreIDs;

    if (existingRow) {
      const existingGenreNames = (existingRow.event_genres || [])
        .map((eg) => {
          const g = eg.genres;
          return Array.isArray(g) ? g[0]?.name : g?.name;
        })
        .filter(Boolean)
        .sort();
      const incomingGenreNames = (event.genres ? [...event.genres] : []).sort();
      const genresChanged = JSON.stringify(existingGenreNames) !== JSON.stringify(incomingGenreNames);

      const changed =
        existingRow.title !== patch.title ||
        new Date(existingRow.start_time).toISOString() !== patch.start_time ||
        normalizeNullableString(existingRow.description) !== patch.description ||
        !sameNullableNumber(existingRow.cost, patch.cost) ||
        normalizeNullableString(existingRow.source_url) !== patch.source_url ||
        (existingRow.artist_id ?? null) !== patch.artist_id ||
        normalizeNullableString(existingRow.image) !== patch.image ||
        (existingRow.status ?? null) !== patch.status ||
        (existingRow.source_type ?? null) !== patch.source_type ||
        (existingRow.ingestion_status ?? null) !== patch.ingestion_status ||
        genresChanged;

      if (!changed) {
        console.log(`No changes: ${event.title}`);
        continue;
      }

      await eventService.updateEventByID(existingRow.id, patch);
      console.log(`Updated existing event: ${event.title}${genresChanged ? ' (including genres)' : ''}`);
    } else { // else, insert new
      const newEvent = await eventService.addEvent(
        event.title,
        venueID,
        event.start_time.toISOString(),
        event.description,
        event.cost ?? null,
        "published",
        "scraping",
        event.source_url,
        "success",
        artistID,
        event.image
      );

      if (genreIDs.length && newEvent?.id) {
        await eventService.updateEventGenres(newEvent.id, genreIDs);
      }
      console.log(`Inserted event: ${event.title}${genreIDs.length ? ` with genres: ${event.genres?.join(', ')}` : ''}`);
    }
  }
}

function normalizeNullableString(s: string | null | undefined) {
  const t = (s ?? "").trim();
  return t.length ? t : null;
}

function sameNullableNumber(a: number | null | undefined, b: number | null | undefined) {
  return (a ?? null) === (b ?? null);
}



// main
// map of venue ID and name to scraper function
const scrapers = [
  //{ id: "f35b17ff-ab6a-4e42-9a6c-2688e341e945", name: "Mills Hardware", func: scrapeMillsHardware },
  //{ id: "204cc1c3-e141-4ba1-9e3f-bde3763149d2", name: "Corktown Pub", func: scrapeCorktownPub },
  //{ id: "22411a86-1b39-442c-8af8-991197838b20", name: "Bridgeworks", func: scrapeBridgeworks },
  //{ id: "723b7d62-f384-4153-9a55-d24de06caa45", name: "McIntyre Performing Arts Centre", func: scrapeMcIntyre },
  { id: "0be4dbff-0b61-485a-b605-ff34e00787fa", name: "TD Coliseum", func: scrapeTDColiseum }
];

for (const { id: venueID, name: venueName, func: scraperFunc } of scrapers) {
  console.log(`\n======================================================`);
  console.log(`Scraping venue ${venueName} (${venueID})...`);
  const data = await scraperFunc();

  if (data?.length) {

    console.log(`\n=== Found ${data.length} events at ${venueName} ===`);
    data.forEach((e: Event, i: number) => {
      const g = e.genres?.length ? ` | ${e.genres.join(", ")}` : "";
      const c = e.cost != null ? ` | $${e.cost.toFixed(2)}` : "";
      const d = e.description ? `\n    ↳ ` + e.description.replace(/\s+/g, " ").substring(0, 75).trim() + "..." : "";
      console.log(`[${i + 1}] ${new Date(e.start_time).toDateString()} - ${e.title}${g}${c}${d}`);
    });
    console.log("");

    try {
      await insertScrapedEvents(data, venueID);
    } catch (err) {
      console.error("Failed to insert events:", err);
    }
  }
}

console.log(`Finished scraping ${scrapers.length} venues.`);