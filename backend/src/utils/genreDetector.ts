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

export async function fetchArtistGenres(artistName: string): Promise<string[]> {
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`;
        const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (response.data && response.data.results && response.data.results.length > 0) {
            const primaryGenre = response.data.results[0].primaryGenreName;
            if (primaryGenre) {
                return [primaryGenre];
            }
        }
    } catch (err) {
        console.error("Failed to fetch genres from iTunes API:", err);
    }
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
