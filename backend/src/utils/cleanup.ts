import { NODE_ENV } from "../app.js";
import { db } from "../db/supabaseClient.js";

const cleanUpUser = async (id: string) => {
    if (NODE_ENV != "test")
        throw "cleanUp functions like cleanUpUser are only available in test environments";

    console.log("Cleaning up user: ", id);
    await db.auth.deleteUser(id);
    await db.users.forceDelete(id);
};

const cleanUpEvent = async (id: string) => {
    if (NODE_ENV != "test")
        throw "cleanUp functions like cleanUpEvent are only available in test environments";

    await db.events.deleteById(id);
};

const cleanUpArtist = async (id: string) => {
    if (NODE_ENV != "test")
        throw "cleanUp functions like cleanUpEvent are only available in test environments";

    await db.artists.deleteById(id);
};

const cleanUpGenre = async (id: string) => {
    if (NODE_ENV != "test")
        throw "cleanUp functions like cleanUpEvent are only available in test environments";

    await db.genres.deleteById(id);
};

const cleanUpVenue = async (id: string) => {
    if (NODE_ENV != "test")
        throw "cleanUp functions like cleanUpEvent are only available in test environments";

    await db.venues.deleteById(id);
};

const cleanUpBookmark = async (userId: string, eventId: string) => {
    if (NODE_ENV != "test")
        throw "cleanUp functions like cleanUpBookmark are only available in test environments";

    await db.bookmarks.delete(userId, eventId);
};

export {
    cleanUpUser,
    cleanUpArtist,
    cleanUpEvent,
    cleanUpGenre,
    cleanUpVenue,
    cleanUpBookmark,
};
