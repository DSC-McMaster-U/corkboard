/**
 * This is the database layer - isolates Supabase usage for team development
 */

import {
    createClient,
    type AdminUserAttributes,
    type SignUpWithPasswordCredentials,
} from "@supabase/supabase-js";
import dotenv from "dotenv";
import { get } from "http";
import { supabaseStorage } from "./supabaseStorage.js";
import { parseEnv } from "../utils/parser.js";

// Load environment variables
dotenv.config();

const NODE_ENV = parseEnv(process.env.NODE_ENV);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
    NODE_ENV == "development" || NODE_ENV == "test"
        ? process.env.SUPABASE_SERVICE_ROLE_KEY!
        : process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

if (NODE_ENV == "development" || NODE_ENV == "test") {
    supabase.auth.signUp = (credential: SignUpWithPasswordCredentials) =>
        supabase.auth.admin
            .createUser({
                email: "email" in credential ? credential.email : "",
                password: credential.password,
                email_confirm: true,
            })
            .then();
}

// switch to Prisma ORM later if needed (later)
export const db = {
    events: {
        getAll: (
            limit: number,
            min_start_time: string,
            max_start_time: string,
            min_cost: number,
            max_cost: number,
            includeArchived: boolean = false,
        ) => {
            let query = supabase
                .from("events")
                .select(
                    `
                    *,
                    venues (
                        id,
                        name,
                        address,
                        venue_type,
                        latitude,
                        longitude
                    ),
                    event_genres (
                        genre_id,
                        genres (
                            id,
                            name
                        )
                    ),
                    artists (
                        id,
                        name,
                        bio,
                        image
                    )
                `,
                )
                .gte("start_time", min_start_time)
                .lte("start_time", max_start_time);

            // filter out archived events by default
            if (!includeArchived) {
                query = query.eq("archived", false);
            }

            // handle NULL costs: only filter by cost if user specified a range
            const isDefaultCostRange =
                min_cost === 0 && max_cost === Number.MAX_VALUE;
            if (!isDefaultCostRange) {
                // apply cost range filter
                // billy's note: NULL costs will be excluded when filtering (standard behavior)
                query = query.or(
                    `cost.is.null,and(cost.gte.${min_cost},cost.lte.${max_cost}))`,
                );
            }

            // filter for published events by default
            query = query
                .eq("status", "published")
                .eq("ingestion_status", "success");

            return query.limit(limit);
        },
        add: (
            title: string,
            venue_id: string,
            start_time: string,
            description?: string | null,
            cost?: number | null,
            status?: "published" | "draft" | "hidden",
            source_type?: "manual" | string | null,
            source_url?: string | null,
            ingestion_status?: "success" | "failed" | "pending",
            artist_id?: string | null,
            image?: string | null,
        ) =>
            supabase.from("events").insert({
                title,
                venue_id,
                start_time,
                description,
                cost,
                status,
                source_type,
                source_url,
                ingestion_status,
                artist_id,
                image,
            }),

        // get events by id
        getById: (eventId: string) =>
            supabase
                .from("events")
                .select(
                    `
                *,
                venues (
                    id,
                    name,
                    address,
                    venue_type,
                    latitude,
                    longitude
                ),
                event_genres (
                    genre_id,
                    genres (
                        id,
                        name
                    )
                ),
                artists (
                    id,
                    name,
                    bio,
                    image
                )
            `,
                )
                .eq("id", eventId)
                .single(),

        // create event
        create: (eventData: {
            title: string;
            description: string | undefined;
            venue_id: string;
            start_time: string;
            cost: number | undefined;
            status: string | undefined;
            source_type: string | undefined;
            source_url: string | undefined;
            image: string | undefined;
            artist_id?: string | undefined;
        }) => supabase.from("events").insert(eventData).select().single(),

        // delete event by ID
        deleteById: (eventId: string) =>
            supabase.from("events").delete().eq("id", eventId),

        // archive an event by ID
        archiveById: (eventId: string) =>
            supabase
                .from("events")
                .update({ archived: true })
                .eq("id", eventId)
                .select()
                .single(),

        // unarchive an event by ID
        unarchiveById: (eventId: string) =>
            supabase
                .from("events")
                .update({ archived: false })
                .eq("id", eventId)
                .select()
                .single(),

        // archive all past events
        archivePastEvents: () =>
            supabase
                .from("events")
                .update({ archived: true })
                .lt("start_time", new Date().toISOString())
                .eq("archived", false),

        getByVenueTimeTitle: (
            venue_id: string,
            min_start_time: string,
            max_start_time: string,
        ) =>
            supabase
                .from("events")
                .select(
                    "id, venue_id, start_time, title, description, cost, source_url, artist_id, image, status, source_type, ingestion_status",
                )
                .eq("venue_id", venue_id)
                .gte("start_time", min_start_time)
                .lte("start_time", max_start_time),

        updateByID: (
            id: string,
            patch: {
                title?: string;
                venue_id?: string;
                start_time?: string;
                description?: string | null;
                cost?: number | null;
                status?: "published" | "draft" | "hidden";
                source_type?: "manual" | string | null;
                source_url?: string | null;
                ingestion_status?: "success" | "failed" | "pending";
                artist_id?: string | null;
                image?: string | null;
            },
        ) =>
            supabase
                .from("events")
                .update(patch)
                .eq("id", id)
                .select()
                .single(),

        deleteForVenue: (venueId: string) =>
            supabase.from("events").delete().eq("venue_id", venueId),

        getUserUploadedDrafts: (
            limit: number,
            min_start_time: string,
            max_start_time: string,
            min_cost: number,
            max_cost: number,
        ) => {
            let query = supabase
                .from("events")
                .select(
                    `
                    *,
                    venues (
                        id,
                        name,
                        address,
                        venue_type,
                        latitude,
                        longitude
                    ),
                    event_genres (
                        genre_id,
                        genres (
                            id,
                            name
                        )
                    ),
                    artists (
                        id,
                        name,
                        bio,
                        image
                    ),
                    users (
                        id,
                        email,
                        name,
                        created_at,
                        username,
                        profile_picture,
                        bio
                    )
                `,
                )
                .gte("start_time", min_start_time)
                .lte("start_time", max_start_time);

            // handle NULL costs: only filter by cost if user specified a range
            const isDefaultCostRange =
                min_cost === 0 && max_cost === Number.MAX_VALUE;
            if (!isDefaultCostRange) {
                // apply cost range filter
                // billy's note: NULL costs will be excluded when filtering (standard behavior)
                query = query.or(
                    `cost.is.null,and(cost.gte.${min_cost},cost.lte.${max_cost}))`,
                );
            }

            // ONLY user uploaded events
            query = query.eq("status", "draft"); //.eq("source_type", "user")  change after db migration

            return query.limit(limit);
        },

        // add a genre to an event
        addGenre: (eventId: string, genreId: string) =>
            supabase
                .from("event_genres")
                .insert({ event_id: eventId, genre_id: genreId })
                .select()
                .single(),

        // remove a genre from an event
        removeGenre: (eventId: string, genreId: string) =>
            supabase
                .from("event_genres")
                .delete()
                .eq("event_id", eventId)
                .eq("genre_id", genreId),

        // remove all genres from an event
        removeAllGenres: (eventId: string) =>
            supabase.from("event_genres").delete().eq("event_id", eventId),
    },
    // artists: {
    //     getAll: (limit = 50) =>
    //         supabase.from("artists").select("*").limit(limit),

    //     getById: (artistId: string) =>
    //         supabase.from("artists").select("*").eq("id", artistId).single(),

    //     getByName: (name: string) =>
    //         supabase.from("artists").select("*").eq("name", name).maybeSingle(),

    //     create: (artistData: {
    //         name: string;
    //         bio?: string | undefined;
    //         image?: string | undefined;
    //         created_at?: string | undefined;
    //     }) => supabase.from("artists").insert(artistData).select().single(),

    //     add: (
    //         name: string,
    //         bio?: string | undefined,
    //         image?: string | undefined,
    //         created_at?: string | undefined,
    //     ) =>
    //         supabase
    //             .from("artists")
    //             .insert({
    //                 name,
    //                 bio,
    //                 image,
    //                 created_at,
    //             })
    //             .select()
    //             .single(),
    // },
    venues: {
        getAll: (limit = 50) =>
            supabase.from("venues").select("*").limit(limit), // returns all venues

        // get venue by ID (helper for validation)
        getById: (venueId: string) =>
            supabase.from("venues").select("*").eq("id", venueId).single(),

        // create venue
        // venue_type enum: "bar", "club", "theater", "venue", "outdoor", "other"
        // billy's note: `create_at` is auto-generated
        create: (venueData: {
            name: string;
            address: string | undefined;
            venue_type: string | undefined;
            latitude: number | undefined;
            longitude: number | undefined;
        }) => supabase.from("venues").insert(venueData).select().single(),

        // deletes a venue, mainly used in test cases
        deleteById: (venueId: string) =>
            supabase.from("venues").delete().eq("id", venueId),
    },
    bookmarks: {
        // get all bookmarks for a user
        getByUserId: (userId: string) =>
            supabase // inner join with events and venues (nested relationship)
                .from("user_bookmarks")
                .select(
                    `
                    *,
                    events (
                        id,
                        title,
                        description,
                        start_time,
                        cost,
                        status,
                        image,
                        source_url,
                        source_type,
                        ingestion_status,
                        created_at,
                        venues (
                            id,
                            name,
                            address,
                            venue_type,
                            latitude,
                            longitude
                        ),
                        event_genres (
                            genre_id,
                            genres (
                                id,
                                name
                            )
                        ),
                        artists (
                            id,
                            name,
                            bio,
                            image
                        )
                    )
                `,
                )
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

        // check if bookmark exists
        exists: (userId: string, eventId: string) =>
            supabase
                .from("user_bookmarks")
                .select("user_id, event_id")
                .eq("user_id", userId)
                .eq("event_id", eventId)
                .maybeSingle(),

        // add bookmark
        create: (userId: string, eventId: string) =>
            supabase
                .from("user_bookmarks")
                .insert({
                    user_id: userId,
                    event_id: eventId,
                })
                .select()
                .single(),

        // remove bookmark
        delete: (userId: string, eventId: string) =>
            supabase
                .from("user_bookmarks")
                .delete()
                .eq("user_id", userId)
                .eq("event_id", eventId),
    },
    users: {
        // get first "real" user for testing (should be "name"="Test User")
        getFirst: () => supabase.from("users").select("*").limit(1).single(),

        // get user by ID
        getById: (userId: string) =>
            supabase.from("users").select("*").eq("id", userId).single(),

        // get user by ID with all favorites (genres, venues, artists)
        getByIdWithFavorites: (userId: string) =>
            supabase
                .from("users")
                .select(
                    `
                    *,
                    genres (
                        id,
                        name
                    ),
                    venues (
                        id,
                        name,
                        address,
                        venue_type
                    ),
                    artists (
                        id,
                        name,
                        bio,
                        image
                    )
                `,
                )
                .eq("id", userId)
                .single(),

        // get user by username
        getByUsername: (username: string) =>
            supabase
                .from("users")
                .select("*")
                .eq("username", username)
                .maybeSingle(),

        // get user by email (for duplicate check)
        getByEmail: (email: string) =>
            supabase.from("users").select("*").eq("email", email).single(),

        updateUser: (
            id: string,
            name: string | undefined,
            username: string | undefined,
            profile_picture: string | undefined,
            bio: string | undefined,
        ) =>
            supabase
                .from("users")
                .update({ name, username, profile_picture, bio })
                .eq("id", id),

        /**
         * Creates a user directly in the users table
         * @deprecated Users should be created through a trigger on sign-up.
         * Should visit the idea of removing this function if it is not needed
         */
        create: (
            name: string,
            email: string,
            username: string | undefined,
            profile_picture: string | undefined,
            bio: string | undefined,
        ) =>
            supabase
                .from("users")
                .insert({ name, email, username, profile_picture, bio })
                .select()
                .single(),

        // update user profile
        updateProfile: (
            userId: string,
            updates: {
                username?: string;
                name?: string;
                profile_picture?: string;
                bio?: string;
            },
        ) =>
            supabase
                .from("users")
                .update(updates)
                .eq("id", userId)
                .select()
                .single(),

        // add favorite genre
        addFavoriteGenre: (userId: string, genreId: string) =>
            supabase
                .from("user_favorite_genres")
                .insert({ user_id: userId, genre_id: genreId })
                .select()
                .single(),

        // remove favorite genre
        removeFavoriteGenre: (userId: string, genreId: string) =>
            supabase
                .from("user_favorite_genres")
                .delete()
                .eq("user_id", userId)
                .eq("genre_id", genreId),

        // add favorite venue
        addFavoriteVenue: (userId: string, venueId: string) =>
            supabase
                .from("user_favorite_venues")
                .insert({ user_id: userId, venue_id: venueId })
                .select()
                .single(),

        // remove favorite venue
        removeFavoriteVenue: (userId: string, venueId: string) =>
            supabase
                .from("user_favorite_venues")
                .delete()
                .eq("user_id", userId)
                .eq("venue_id", venueId),

        // add favorite artist
        addFavoriteArtist: (userId: string, artistId: string) =>
            supabase
                .from("user_favorite_artists")
                .insert({ user_id: userId, artist_id: artistId })
                .select()
                .single(),

        // remove favorite artist
        removeFavoriteArtist: (userId: string, artistId: string) =>
            supabase
                .from("user_favorite_artists")
                .delete()
                .eq("user_id", userId)
                .eq("artist_id", artistId),

        // force deletes a user, not intended for production use, only available for test cleanup
        forceDelete: (userId: string) => {
            if (NODE_ENV != "test")
                throw "forceDelete is not available outside of test environments";

            return supabase
                .from("users")
                .delete()
                .eq("id", userId)
                .select()
                .single();
        },

        getPersonalizedEventSuggestions: (userId: string, limit: number) => {
            return supabase
                .from("personalized_event_suggestions")
                .select(
                    `
                    *,
                    venues!venue_id (
                        id,
                        name,
                        address,
                        venue_type,
                        latitude,
                        longitude
                    ),
                    event_genres (
                        genre_id,
                        genres (
                            id,
                            name
                        )
                    ),
                    artists!artist_id (
                        id,
                        name,
                        bio,
                        image
                    )
                `,
                )
                .eq("user_id", userId)
                .order("score", {
                    ascending: false,
                })
                .limit(limit);
        },
    },
    genres: {
        // get all genres
        getAll: () => supabase.from("genres").select("*"),

        // get genre by name
        getByName: (name: string) =>
            supabase.from("genres").select("*").eq("name", name).single(), // Changed to .single() from maybeSingle() for consistent erroring

        // create genre
        create: (name: string) =>
            supabase.from("genres").insert({ name }).select().single(),

        // delete genre by ID
        deleteById: (genreId: string) =>
            supabase.from("genres").delete().eq("id", genreId),
    },
    artists: {
        // get all artists
        getAll: (limit = 50) =>
            supabase.from("artists").select("*").limit(limit),

        // get artist by ID
        getById: (artistId: string) =>
            supabase.from("artists").select("*").eq("id", artistId).single(),

        // get artist by name (for duplicate check)
        getByName: (name: string) =>
            supabase.from("artists").select("*").eq("name", name).maybeSingle(),

        // create artist (with object parameter)
        create: (artistData: {
            name: string;
            bio?: string | undefined;
            image?: string | undefined;
            created_at?: string | undefined;
        }) => supabase.from("artists").insert(artistData).select().single(),

        // add artist (with individual parameters - convenience method)
        add: (
            name: string,
            bio?: string | undefined,
            image?: string | undefined,
            created_at?: string | undefined,
        ) =>
            supabase
                .from("artists")
                .insert({
                    name,
                    bio,
                    image,
                    created_at,
                })
                .select()
                .single(),
    },
    storage: {
        // upload file to storage bucket
        upload: (
            bucket: "events" | "artists" | "users",
            filePath: string,
            file: File | Blob | Buffer,
            options?: {
                contentType?: string;
                cacheControl?: string;
                upsert?: boolean;
            },
        ) =>
            supabaseStorage.storage
                .from(bucket)
                .upload(filePath, file, options),

        // get public URL for a file
        getPublicUrl: (
            bucket: "events" | "artists" | "users",
            filePath: string,
        ) => {
            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
            return { data: { publicUrl: data.publicUrl } };
        },

        // delete file from storage
        delete: (bucket: "events" | "artists" | "users", filePath: string) =>
            supabaseStorage.storage.from(bucket).remove([filePath]),

        // list files in bucket
        list: (bucket: "events" | "artists" | "users", path?: string) =>
            supabaseStorage.storage.from(bucket).list(path),
    },
    auth: {
        // validate JWT token with Supabase Auth
        validateJWT: (token: string) => supabase.auth.getUser(token),

        // sign up new user in Supabase Auth, cascades delete to public.user table
        signUp: (email: string, password: string) =>
            supabase.auth.signUp({ email, password }),

        // sign in user and get JWT token
        signIn: (email: string, password: string) =>
            supabase.auth.signInWithPassword({ email, password }),

        // sign out user (optional, for future use)
        signOut: () => supabase.auth.signOut(),

        // delete user by id, does not cascade delete to public.user table
        deleteUser: (id: string) => {
            if (NODE_ENV != "test")
                throw "deleteUser is not available of test environments";

            supabase.auth.admin.deleteUser(id);
        },
    },
    healthCheck: () => supabase.from("venues").select("count").limit(1), // returns the number of venues
};
