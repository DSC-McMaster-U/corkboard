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
