import { describe, it, expect, afterAll } from "@jest/globals";
import { db } from "../db/supabaseClient.js";
import request from "supertest";
import app from "../app.js";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { strictMatchFields } from "../utils/cmp.js";

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

describe("Users test suite", () => {
    describe("getById", () => {
        it("should get user by ID", async () => {
            // get first user for testing
            const { data: firstUser } = await db.users.getFirst();
            if (!firstUser) {
                throw new Error("No users found in database");
            }

            const { data: user, error } = await db.users.getById(firstUser.id);

            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(user?.id).toBe(firstUser.id);
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
            const { data: firstUser } = await db.users.getFirst();
            if (!firstUser) {
                throw new Error("No users found in database");
            }

            const { data: user, error } = await db.users.getByIdWithFavorites(
                firstUser.id,
            );

            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(user?.id).toBe(firstUser.id);

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
            const { data: firstUser } = await db.users.getFirst();
            if (!firstUser || !firstUser.email) {
                throw new Error("No users with email found in database");
            }

            const { data: user, error } = await db.users.getByEmail(
                firstUser.email,
            );

            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(user?.email).toBe(firstUser.email);
        });
    });

    describe("updateProfile", () => {
        it("should update user profile fields", async () => {
            const { data: firstUser } = await db.users.getFirst();
            if (!firstUser) {
                throw new Error("No users found in database");
            }

            const updates = {
                bio: "Updated bio for testing",
            };

            const { data: updatedUser, error } = await db.users.updateProfile(
                firstUser.id,
                updates,
            );

            expect(error).toBeNull();
            expect(updatedUser).toBeDefined();
            expect(updatedUser?.bio).toBe(updates.bio);

            // clean up: restore original bio if it existed
            if (firstUser.bio !== undefined) {
                await db.users.updateProfile(firstUser.id, {
                    bio: firstUser.bio,
                });
            }
        });

        it("should update username", async () => {
            const { data: firstUser } = await db.users.getFirst();
            if (!firstUser) {
                throw new Error("No users found in database");
            }

            const originalUsername = firstUser.username;
            const testUsername = `test_${Date.now()}`;

            const { data: updatedUser, error } = await db.users.updateProfile(
                firstUser.id,
                { username: testUsername },
            );

            expect(error).toBeNull();
            expect(updatedUser).toBeDefined();
            expect(updatedUser?.username).toBe(testUsername);

            // clean up: restore original username
            await db.users.updateProfile(firstUser.id, {
                username: originalUsername || null,
            });
        });
    });

    describe("Favorite Genres", () => {
        it("should add favorite genre", async () => {
            const { data: firstUser } = await db.users.getFirst();
            const { data: genres } = await db.genres.getAll();

            if (!firstUser || !genres || genres.length === 0) {
                throw new Error("No users or genres found");
            }

            const genreId = genres[0].id;

            // remove if already exists
            await db.users.removeFavoriteGenre(firstUser.id, genreId);

            const { data: favorite, error } = await db.users.addFavoriteGenre(
                firstUser.id,
                genreId,
            );

            expect(error).toBeNull();
            expect(favorite).toBeDefined();
            expect(favorite?.user_id).toBe(firstUser.id);
            expect(favorite?.genre_id).toBe(genreId);

            // Clean up
            await db.users.removeFavoriteGenre(firstUser.id, genreId);
        });

        it("should remove favorite genre", async () => {
            const { data: firstUser } = await db.users.getFirst();
            const { data: genres } = await db.genres.getAll();

            if (!firstUser || !genres || genres.length === 0) {
                throw new Error("No users or genres found");
            }

            const genreId = genres[0].id;

            // add first
            await db.users.addFavoriteGenre(firstUser.id, genreId);

            // then remove
            const { error } = await db.users.removeFavoriteGenre(
                firstUser.id,
                genreId,
            );

            expect(error).toBeNull();
        });
    });

    describe("Favorite Venues", () => {
        it("should add favorite venue", async () => {
            const { data: firstUser } = await db.users.getFirst();
            const { data: venues } = await db.venues.getAll(1);

            if (!firstUser || !venues || venues.length === 0) {
                throw new Error("No users or venues found");
            }

            const venueId = venues[0].id;

            // remove if already exists
            await db.users.removeFavoriteVenue(firstUser.id, venueId);

            const { data: favorite, error } = await db.users.addFavoriteVenue(
                firstUser.id,
                venueId,
            );

            expect(error).toBeNull();
            expect(favorite).toBeDefined();
            expect(favorite?.user_id).toBe(firstUser.id);
            expect(favorite?.venue_id).toBe(venueId);

            // clean up
            await db.users.removeFavoriteVenue(firstUser.id, venueId);
        });

        it("should remove favorite venue", async () => {
            const { data: firstUser } = await db.users.getFirst();
            const { data: venues } = await db.venues.getAll(1);

            if (!firstUser || !venues || venues.length === 0) {
                throw new Error("No users or venues found");
            }

            const venueId = venues[0].id;

            // add first
            await db.users.addFavoriteVenue(firstUser.id, venueId);

            // then remove
            const { error } = await db.users.removeFavoriteVenue(
                firstUser.id,
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

    it("should be unimplemented pending an investigation into auth testing", () => {
        console.warn("Test suite is unimplemented due to auth warnings");
    });

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
            .send({ email: "auto-test@corkboard.com" });

        logCreatedJWT(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Non-empty password is required");
    });

    it("should return 500 if an in-use email is passed", async () => {
        let response = await request(app).post(path).send({
            email: "auto-test-inuse@gmail.com",
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
    for (let i = 0; i < createdJWTs.length; i++) {
        let jwt = createdJWTs[i]!;

        let id = (await db.auth.validateJWT(jwt)).data.user?.id!;

        console.log("Cleaning up user: ", id);
        await db.auth.deleteUser(id);
    }
});
