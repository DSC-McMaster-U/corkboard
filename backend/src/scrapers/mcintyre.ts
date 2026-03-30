/* Jan 19th 2026
 * to run this file directly, use (from the backend directory)
 * `node --loader ts-node/esm src/scrapers/mcintyre.ts` 
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { detectGenres } from "../utils/genreDetector.js";
import type { Event } from "../utils/types.js";


function cleanText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function splitLines(text: string) {
  return text
    .split("\n")
    .map((l) => cleanText(l))
    .filter(Boolean);
}

function parseLowestPrice(lines: string[]): number | undefined {
  const prices: number[] = [];
  for (const line of lines) {
    const matches = line.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/g);
    if (!matches) continue;
    for (const m of matches) {
      const n = Number(m.replace("$", ""));
      if (!Number.isNaN(n)) prices.push(n);
    }
  }
  return prices.length ? Math.min(...prices) : undefined;
}

function parseMonthDayTimeLocal(line: string): Date | null {
  const m = line.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*(?:,|at)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i
  );
  if (!m) return null;

  const monthMap: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  const monthName = m[1]!.toLowerCase();
  const mon = monthMap[monthName];
  const day = Number(m[2]);
  let hh = Number(m[3]);
  const mm = m[4] ? Number(m[4]) : 0;
  const ampm = m[5]!.toUpperCase();

  if (ampm === "AM" && hh === 12) hh = 0;
  if (ampm === "PM" && hh !== 12) hh += 12;

  const now = new Date();
  const baseYear = now.getFullYear();
  const nowMon = now.getMonth();
  const year = mon! + 6 < nowMon ? baseYear + 1 : baseYear;

  return new Date(year, mon!, day, hh, mm, 0, 0);
}

async function fetchHtml(url: string) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return String(data);
}

function extractCost($: cheerio.CheerioAPI): number | undefined {
  // 1. check explicit price rows
  const priceCosts = $(".price_row .price_cost")
    .toArray()
    .map((el) => cleanText($(el).text()))
    .filter(Boolean);

  if (priceCosts.length > 0) {
    return parseLowestPrice(priceCosts);
  }

  // 2. check tribe cost blocks
  const tribeCostText =
    cleanText($(".tribe-events-event-cost").first().text()) ||
    cleanText($(".tribe-events-cost").first().text());

  if (tribeCostText) {
    return parseLowestPrice([tribeCostText]);
  }

  // 3. check main description area
  const scopedText = cleanText(
    $(".single_event_details, .single_event_additional_content, .single_event_buyticket_content")
      .first()
      .text()
  );

  if (scopedText) {
    const lines = splitLines(scopedText)
      // try to avoid fee lines
      .filter((l) => !/fee|service\s*charge|convenience/i.test(l));
    return parseLowestPrice(lines);
  }

  return undefined;
}

export async function scrapeWebsite(url: string) {
  try {
    const listUrl = new URL("/events/list/?hide_subsequent_recurrences=1", url).toString();

    const html = await fetchHtml(listUrl);
    const $ = cheerio.load(html);

    const results: Event[] = [];

    const articles = $("article.tribe-events-calendar-list__event").toArray();

    for (const article of articles) {
      const $a = $(article);

      const title = cleanText(
        $a.find("a.tribe-events-calendar-list__event-title-link").first().text()
      );

      const eventUrl = $a
        .find("a.tribe-events-calendar-list__event-title-link")
        .first()
        .attr("href");

      if (!eventUrl) return;

      const snippet = cleanText(
        $a.find(".tribe-events-calendar-list__event-description").first().text()
      );

      // const img =
      //   $a.find("img.tribe-events-calendar-list__event-featured-image").first().attr("src") ||
      //   "/images/events/mcintyrepac.jpg";
      const img = "https://dniawpahwcqtvcnaaexv.supabase.co/storage/v1/object/public/events/mcintyre.jpg";

      const dateStartText = cleanText($a.find(".tribe-event-date-start").first().text()); 
      const start_time = parseMonthDayTimeLocal(dateStartText);
      if (!start_time) return;

      const detailHtml = await fetchHtml(eventUrl);
      const $detail = cheerio.load(detailHtml);
      const cost = extractCost($detail);

      // detect genres
      const genres = detectGenres(title, snippet);

      results.push({
        title: title || "Untitled Event",
        artist: title || null,
        description: snippet,
        start_time: start_time,
        source_url: eventUrl,
        image: img,
        cost: cost ?? null,
        genres: genres,
      });
    };

    results.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    return results;
  } catch (err) {
    console.error("Scraping failed:", err);
    return [];
  }
}

export async function scrapeMcIntyre() {
    const data = await scrapeWebsite("https://mcintyrepac.ca/events/");
    return data || [];
}

// const data = await scrapeMcIntyre();
// console.log(data);