import axios from "axios";

const genreMap: Record<string, string[]> = {
    "Rock": ["rock", "indie", "punk", "alternative", "metal", "grunge", "garage"],
    "Jazz": ["jazz", "swing", "blues", "big band"],
    "Electronic": ["electronic", "dj", "techno", "house", "synth", "dance", "retro 80s"],
    "Folk": ["folk", "singer-songwriter", "acoustic", "kitchen party", "east coast"],
    "Pop": ["pop", "top 40"],
    "Classical": ["classical", "orchestra", "piano", "violin"],
    "Disco": ["disco", "boogie", "funk"],
    "Country": ["country", "bluegrass", "folk"],
    "Hip Hop": ["hip hop", "rap", "r&b"],
    "Reggae": ["reggae", "dub", "ska"],
    "Irish": ["irish", "celtic", "fiddle"],
};

/**
 * Detects genres from a given title and description by matching keywords.
 * @param title - The title of the event.
 * @param description - The description of the event.
 * @returns An array of detected genre names.
 */
export function detectGenres(title: string, description: string): string[] {
    const genres: string[] = [];
    const haystack = (title + " " + (description || "")).toLowerCase();

    for (const [genre, keywords] of Object.entries(genreMap)) {
        if (keywords.some(k => haystack.includes(k))) {
            genres.push(genre);
        }
    }

    return genres;
}

const artistGenreCache = new Map<string, string[]>();
let lastItunesRequestTime = 0;
const ITUNES_MIN_INTERVAL_MS = 3100; // ~20 requests/minute
const ITUNES_TIMEOUT_MS = 5000;
const ITUNES_MAX_RETRIES = 3;

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchArtistGenres(artistName: string): Promise<string[]> {
    const cached = artistGenreCache.get(artistName);
    if (cached) {
        return cached;
    }

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`;

    for (let attempt = 1; attempt <= ITUNES_MAX_RETRIES; attempt++) {
        // Simple throttle to respect iTunes Search API rate limit
        const now = Date.now();
        const elapsed = now - lastItunesRequestTime;
        if (elapsed < ITUNES_MIN_INTERVAL_MS) {
            await delay(ITUNES_MIN_INTERVAL_MS - elapsed);
        }

        lastItunesRequestTime = Date.now();

        try {
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: ITUNES_TIMEOUT_MS,
            });

            if (response.data && response.data.results && response.data.results.length > 0) {
                const primaryGenre = response.data.results[0].primaryGenreName;
                if (primaryGenre) {
                    const genres = [primaryGenre];
                    artistGenreCache.set(artistName, genres);
                    return genres;
                }
            }

            // No genre found; cache and return empty array
            artistGenreCache.set(artistName, []);
            return [];
        } catch (err: any) {
            // Retry on 429 or 5xx responses with simple backoff
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                if ((status === 429 || status >= 500) && attempt < ITUNES_MAX_RETRIES) {
                    const backoffMs = attempt * 1000;
                    await delay(backoffMs);
                    continue;
                }
            }
            console.error("Failed to fetch genres from iTunes API:", err);
            break;
        }
    }

    artistGenreCache.set(artistName, []);
    return [];
}

export async function detectGenresAsync(artist: string | null, title: string, description: string): Promise<string[]> {
    // Try local keyword match first
    const localGenres = detectGenres(title, description);
    if (localGenres.length > 0) return localGenres;

    // Fall back to iTunes API if artist is known
    if (artist) {
        const parts = artist.split(/ with |:| - |\|/i).map(p => p.trim()).filter(p => p);

        for (const part of parts) {
            const cleanPart = part.replace(/\b(tribute|cover|rumours)\b/gi, "").trim();
            if (cleanPart) {
                const remoteGenres = await fetchArtistGenres(cleanPart);
                if (remoteGenres.length > 0 && !remoteGenres.includes("Documentary")) {
                    return remoteGenres;
                }
            }
        }
    }

    return [];
}
