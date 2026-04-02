/* March 30th 2026
 * to run this file directly, use (from the backend directory)
 * `node --loader ts-node/esm src/scrapers/tdcoliseum.ts` 
 */

import axios from "axios";
import { detectGenresAsync } from "../utils/genreDetector.js";
import dotenv from "dotenv";
dotenv.config();

import type { Event } from "../utils/types.js";

const TICKETMASTER_VENUE_ID = "KovZpZAEdJEA";

export async function scrapeTDColiseum(): Promise<Event[]> {
    const API_KEY = process.env.TICKETMASTER_DISCOVERY_KEY;
    if (!API_KEY) {
        console.error("Missing TICKETMASTER_DISCOVERY_KEY in .env");
        return [];
    }

    try {
        console.log("Fetching TD Coliseum events from Ticketmaster API...");
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&venueId=${TICKETMASTER_VENUE_ID}&classificationName=music&sort=date,asc&size=20`;
        const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        //console.log(JSON.stringify(response.data, null, 2));

        const rawEvents = response.data._embedded?.events || [];
        console.log(`Found ${rawEvents.length} distinct events! Passing them to iTunes API to classify genres (this will take about a minute due to rate limits)...`);
        const results: Event[] = [];

        for (const e of rawEvents) {
            if (!e.dates?.start?.dateTime || !e.name || !e.url) continue;

            const title = e.name.trim();
            const artist = e._embedded?.attractions?.[0]?.name || title;
            const description = e.info || e.description || e.pleaseNote || artist;
            process.stdout.write("."); // loading bar effect
            const start_time = new Date(e.dates.start.dateTime);
            const source_url = e.url;

            let image = "https://dniawpahwcqtvcnaaexv.supabase.co/storage/v1/object/public/events/corktown-pub.jpg";
            if (e.images && e.images.length > 0) {
                // Find highest resolution 16:9 ratio image
                const bestImages = e.images.filter((img: any) => img.ratio === "16_9").sort((a: any, b: any) => b.width - a.width);
                if (bestImages.length > 0 && bestImages[0].url) {
                    image = bestImages[0].url;
                } else if (e.images[0].url) {
                    image = e.images[0].url;
                }
            }

            let cost: number | undefined;
            let costMax = 0; // Just for completeness, though we only use the min cost locally
            if (e.priceRanges && e.priceRanges.length > 0) {
                const mins = e.priceRanges.map((pr: any) => pr.min).filter((m: any) => m !== undefined && m !== null);
                if (mins.length > 0) {
                    cost = Math.min(...mins);
                }
            }

            const genres = await detectGenresAsync(artist, title, description);

            results.push({
                title,
                description,
                start_time,
                source_url,
                artist,
                image,
                cost: cost ?? null,
                genres: genres
            });
        }

        return results;

    } catch (err: any) {
        if (axios.isAxiosError(err)) {
            console.error("Ticketmaster API Error:", err.response?.data || err.message);
        } else {
            console.error("Scraping failed:", err);
        }
        return [];
    }
}

const data = await scrapeTDColiseum();
console.log(JSON.stringify(data, null, 2));