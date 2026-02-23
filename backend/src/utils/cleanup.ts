import { NODE_ENV } from "../app.js";
import { db } from "../db/supabaseClient.js";

const cleanUpUser = async (id: string) => {
    if (NODE_ENV != "test")
        throw "cleanUp functions like cleanUpUser are only available in test environments";

    console.log("Cleaning up user: ", id);
    await db.auth.deleteUser(id);
    await db.users.forceDelete(id);
};

export { cleanUpUser };
