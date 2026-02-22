import { describe, it, expect, afterAll, beforeAll } from "@jest/globals";
import { db } from "../db/supabaseClient.js";
import request from "supertest";
import app from "../app.js";
import { strictMatchFields } from "../utils/cmp.js";
import { cleanUpUser } from "../utils/cleanup.js";

const existing_user = {
    email: "user-test-" + Math.random().toString(16) + "@corkboard.com",
    password: Math.random().toString(36) + Math.random().toString(36),
    id: "",
};

let createdJWTs: Array<string> = [];

const logCreatedJWT = (response: any) => {
    if (response.body == undefined) {
        return;
    }

    if (response.body.jwt == undefined) {
        return;
    }

    createdJWTs.push(response.body.jwt);
};

const matchUsers = (userA: any, userB: any): boolean =>
    strictMatchFields(userA, userB, [
        "id",
        "email",
        "name",
        "username",
        "bio",
        "profile_picture",
    ]);

beforeAll(async () => {
    let created = await db.auth.signUp(
        existing_user.email,
        existing_user.password,
    );

    existing_user.id = created?.data.user!.id!;
});

describe("Users test suite", () => {
    describe("getById", () => {
        it("should get user by ID", async () => {
            const userId = existing_user.id;

            const { data: user, error } = await db.users.getById(userId);

            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(user?.id).toBe(userId);
            expect(user?.email).toBeDefined();
        });

        it("should return error for non-existent user ID", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const { data: user, error } = await db.users.getById(fakeId);

            expect(error).toBeDefined();
            expect(user).toBeNull();
        });
    });

    describe("getByIdWithFavorites", () => {
        it("should get user with all favorites (genres, venues, artists)", async () => {
            const userId = existing_user.id;

            const { data: user, error } =
                await db.users.getByIdWithFavorites(userId);

            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(user?.id).toBe(userId);

            expect(user).toHaveProperty("user_favorite_genres");
            expect(user).toHaveProperty("user_favorite_venues");
            expect(user).toHaveProperty("user_favorite_artists");

            if (
                user?.user_favorite_genres &&
                user.user_favorite_genres.length > 0
            ) {
                expect(user.user_favorite_genres[0]).toHaveProperty("genre_id");
                expect(user.user_favorite_genres[0]).toHaveProperty("genres");
            }
        });
    });

    describe("getByUsername", () => {
        it("should get user by username", async () => {
            const { data: user, error } =
                await db.users.getByUsername("testuser");

            expect(error).toBeNull();
            expect(user.username).toBe("testuser");
        });

        it("should return null for non-existent username", async () => {
            const { data: user, error } =
                await db.users.getByUsername("usernonexistent");

            expect(user).toBeNull();
        });
    });

    describe("getByEmail", () => {
        it("should get user by email", async () => {
            const { data: user, error } = await db.users.getByEmail(
                existing_user.email,
            );

            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(user?.email).toBe(existing_user.email);
        });
    });

    describe("updateProfile", () => {
        it("should update user profile fields", async () => {
            const userId = existing_user.id;

            const updates = {
                bio: "Updated bio for testing",
            };

            const { data: updatedUser, error } = await db.users.updateProfile(
                userId,
                updates,
            );

            expect(error).toBeNull();
            expect(updatedUser).toBeDefined();
            expect(updatedUser?.bio).toBe(updates.bio);
        });

        it("should update username", async () => {
            const userId = existing_user.id;
            const testUsername = `test_${Date.now()}`;

            const { data: updatedUser, error } = await db.users.updateProfile(
                userId,
                { username: testUsername },
            );

            expect(error).toBeNull();
            expect(updatedUser).toBeDefined();
            expect(updatedUser?.username).toBe(testUsername);
        });
    });

    describe("Favorite Genres", () => {
        it("should add favorite genre", async () => {
            const userId = existing_user.id;
            const { data: genres } = await db.genres.getAll();

            if (!genres || genres.length === 0) {
                throw new Error("No users or genres found");
            }

            const genreId = genres[0].id;

            // remove if already exists
            await db.users.removeFavoriteGenre(userId, genreId);

            const { data: favorite, error } = await db.users.addFavoriteGenre(
                userId,
                genreId,
            );

            expect(error).toBeNull();
            expect(favorite).toBeDefined();
            expect(favorite?.user_id).toBe(userId);
            expect(favorite?.genre_id).toBe(genreId);

            // Clean up
            await db.users.removeFavoriteGenre(userId, genreId);
        });

        it("should remove favorite genre", async () => {
            const userId = existing_user.id;
            const { data: genres } = await db.genres.getAll();

            if (!genres || genres.length === 0) {
                throw new Error("No users or genres found");
            }

            const genreId = genres[0].id;

            // add first
            await db.users.addFavoriteGenre(userId, genreId);

            // then remove
            const { error } = await db.users.removeFavoriteGenre(
                userId,
                genreId,
            );

            expect(error).toBeNull();
        });
    });

    describe("Favorite Venues", () => {
        it("should add favorite venue", async () => {
            const userId = existing_user.id;
            const { data: venues } = await db.venues.getAll(1);

            if (!venues || venues.length === 0) {
                throw new Error("No venues found");
            }

            const venueId = venues[0].id;

            // remove if already exists
            await db.users.removeFavoriteVenue(userId, venueId);

            const { data: favorite, error } = await db.users.addFavoriteVenue(
                userId,
                venueId,
            );

            expect(error).toBeNull();
            expect(favorite).toBeDefined();
            expect(favorite?.user_id).toBe(userId);
            expect(favorite?.venue_id).toBe(venueId);

            // clean up
            await db.users.removeFavoriteVenue(userId, venueId);
        });

        it("should remove favorite venue", async () => {
            const userId = existing_user.id;
            const { data: venues } = await db.venues.getAll(1);

            if (!venues || venues.length === 0) {
                throw new Error("No users or venues found");
            }

            const venueId = venues[0].id;

            // add first
            await db.users.addFavoriteVenue(userId, venueId);

            // then remove
            const { error } = await db.users.removeFavoriteVenue(
                userId,
                venueId,
            );

            expect(error).toBeNull();
        });
    });

    // describe("Favorite Artists", () => {
    //     it("should add favorite artist", async () => {

    //         const { data: firstUser } = await db.users.getFirst();
    //         if (!firstUser) {
    //             throw new Error("No users found");
    //         }

    //         // create a test artist first
    //         const artistName = `Test Artist ${Date.now()}`;
    //         const { data: artist, error: createError } = await db.artists.create(
    //             artistName
    //         );

    //         if (createError || !artist) {
    //             throw new Error("Failed to create artist");
    //         }

    //         const artistId = artist.id;

    //         // remove if already exists
    //         await db.users.removeFavoriteArtist(firstUser.id, artistId);

    //         const { data: favorite, error } = await db.users.addFavoriteArtist(
    //             firstUser.id,
    //             artistId
    //         );

    //         expect(error).toBeNull();
    //         expect(favorite).toBeDefined();
    //         expect(favorite?.user_id).toBe(firstUser.id);
    //         expect(favorite?.artist_id).toBe(artistId);

    //         // clean up
    //         await db.users.removeFavoriteArtist(firstUser.id, artistId);

    //     });

    //     it("should remove favorite artist", async () => {

    //         const { data: firstUser } = await db.users.getFirst();
    //         if (!firstUser) {
    //             throw new Error("No users found");
    //         }

    //         // create a test artist first
    //         const artistName = `Test Artist ${Date.now()}`;
    //         const { data: artist, error: createError } = await db.artists.create(
    //             artistName
    //         );

    //         if (createError) {
    //             throw new Error("Failed to create artist");
    //         }
    //         const artistId = artist.id;

    //         // Add first
    //         await db.users.addFavoriteArtist(firstUser.id, artistId);

    //         // Then remove
    //         const { error } = await db.users.removeFavoriteArtist(
    //             firstUser.id,
    //             artistId
    //         );

    //         expect(error).toBeNull();
    //     });
    // });
});

describe("POST /api/users", () => {
    const path = "/api/users";

    it("should return 400 if no email is passed", async () => {
        let response = await request(app)
            .post(path)
            .send({ password: "auto-test-pass" });

        logCreatedJWT(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Non-empty email is required");
    });

    it("should return 400 if no password is passed", async () => {
        let response = await request(app)
            .post(path)
            .send({ email: "crazy-email@corkboard.com" });

        logCreatedJWT(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Non-empty password is required");
    });

    it("should return 500 if an in-use email is passed", async () => {
        let response = await request(app).post(path).send({
            email: existing_user.email,
            password: "any-password",
        });

        logCreatedJWT(response);

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
    });

    it("should return 200 if a valid email and password are passed", async () => {
        let user = {
            email: "cork.test@gmail.com",
            password: "auto-test-pass",
        };

        let response = await request(app).post(path).send(user);

        logCreatedJWT(response);

        expect(response.statusCode).toBe(200);
        expect(response.body.success);
        expect(response.body.jwt).toBeDefined();

        let id = (await db.auth.validateJWT(response.body.jwt)).data.user?.id!;

        let userInDb = await db.users.getById(id);

        expect(matchUsers(user, userInDb));
    });
});

afterAll(async () => {
    await cleanUpUser(existing_user.id);

    for (let i = 0; i < createdJWTs.length; i++) {
        let jwt = createdJWTs[i]!;

        let id = (await db.auth.validateJWT(jwt)).data.user?.id!;

        await cleanUpUser(id);
    }
});
