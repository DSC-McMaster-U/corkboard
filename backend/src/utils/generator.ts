import { NODE_ENV } from "../app.js";
import { artistService } from "../services/artistService.js";
import { eventService } from "../services/eventService.js";
import { genresService } from "../services/genresService.js";
import { userService } from "../services/userService.js";
import { venueService } from "../services/venueService.js";
import {
    cleanUpArtist,
    cleanUpEvent,
    cleanUpGenre,
    cleanUpUser,
    cleanUpVenue,
} from "./cleanup.js";

const generateId = (): string => String(Math.floor(Math.random() * 1e10));
const generatePassword = (): string =>
    Math.random().toString(36) + Math.random().toString(36);
const randomIntRange = (range: [number, number]) =>
    Math.floor(Math.random() * (range[1] - range[0]) + range[0]);

class Generator {
    generatedArtists: string[] = [];
    generatedEvents: string[] = [];
    generatedUsers: string[] = [];
    generatedVenues: string[] = [];
    generatedGenres: string[] = [];

    constructor() {}

    /**
     * The following generator functions return the ID of the object they create unless otherwise specified
     */
    generateEvent = async (props?: {
        dateRange?: [number, number];
        costRange?: [number, number];
        withArtist?: boolean;
    }): Promise<string> => {
        if (NODE_ENV != "test")
            throw "generator functions like generateEvent are only available in test environments";

        const {
            dateRange = [0, 10],
            costRange = [0, 30],
            withArtist = false,
        } = props ?? {};

        const venueId = await this.generateVenue();
        const start_time = new Date();
        start_time.setDate(start_time.getDate() + randomIntRange(dateRange));
        const cost = randomIntRange(costRange);

        return eventService
            .createEvent(
                "GENERATED-EVENT-" + generateId(),
                venueId,
                start_time.toISOString(),
                undefined,
                cost,
                undefined,
                undefined,
                undefined,
                undefined,
                (withArtist ?? false) ? await this.generateArtist() : undefined,
            )
            .then((result) => {
                const id = result.id;
                this.generatedEvents.push(id);
                return id;
            })
            .catch((err) => {
                throw new Error("Unable to generate event:\n" + String(err));
            });
    };

    generateVenue = async (): Promise<string> => {
        if (NODE_ENV != "test")
            throw "generator functions like generateVenue are only available in test environments";

        return venueService
            .createVenue("GENERATED-VENUE-" + generateId())
            .then((result) => {
                const id = result.id;
                this.generatedVenues.push(id);
                return id;
            })
            .catch((err) => {
                throw new Error("Unable to generate venue:\n" + String(err));
            });
    };

    // Returns ID if withSession is not passed or is false, returns JWT if withSession is true
    generateUser = async (props?: {
        withSession?: boolean;
        password?: string;
    }): Promise<string> => {
        if (NODE_ENV != "test")
            throw "generator functions like generateUser are only available in test environments";

        const { withSession = false, password = generatePassword() } =
            props ?? {};

        const email = "GENERATED-USER-" + generateId() + "@corkboard.test.ca";

        return userService
            .signUpUser(email, password)
            .then((result) => {
                const id = result.user?.id!;
                this.generatedUsers.push(id);

                if (withSession ?? false) {
                    return userService
                        .signInUser(email, password)
                        .then((result) => {
                            return result.session.access_token;
                        })
                        .catch((err) => {
                            throw new Error(
                                "Unable to authenticate generated user:\n" +
                                    String(err),
                            );
                        });
                }

                return id;
            })
            .catch((err) => {
                throw new Error("Unable to generate user:\n" + String(err));
            });
    };

    generateArtist = async (): Promise<string> => {
        if (NODE_ENV != "test")
            throw "generator functions like generateArtist are only available in test environments";

        return artistService
            .createArtist("GENERATED-ARTIST-" + generateId())
            .then((result) => {
                const id = result.id;
                this.generatedArtists.push(id);
                return id;
            })
            .catch((err) => {
                throw new Error("Unable to generate artist:\n" + String(err));
            });
    };

    generateGenre = async (): Promise<string> => {
        if (NODE_ENV != "test")
            throw "generator functions like generateGenre are only available in test environments";

        return genresService
            .create("GENERATED-GENRE-" + generateId())
            .then((result) => {
                const id = result.id;
                this.generatedGenres.push(id);
                return id;
            })
            .catch((err) => {
                throw new Error("Unable to generate artist:\n" + String(err));
            });
    };

    cleanUp = async () => {
        this.generatedArtists.forEach(async (artist) => {
            await cleanUpArtist(artist);
        });

        this.generatedEvents.forEach(async (event) => {
            await cleanUpEvent(event);
        });

        this.generatedGenres.forEach(async (genre) => {
            await cleanUpGenre(genre);
        });

        this.generatedUsers.forEach(async (user) => {
            await cleanUpUser(user);
        });

        this.generatedVenues.forEach(async (venue) => {
            await cleanUpVenue(venue);
        });
    };
}

export { Generator, generatePassword };
