import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import app from "../app.js";
import { Generator } from "../utils/generator.js";

// Invalid event ID
const INVALID_EVENT_ID = "abcdefgh-ijkl-mnop-qrst-uvwxyzabcdef";

const generator = new Generator();

describe("GET /api/bookmarks/", () => {
    let path = "/api/bookmarks/";
    let USER_JWT: string;

    beforeAll(async () => {
        USER_JWT =
            "Bearer " +
            (await generator.generateUser({ withSession: true })).jwt!;
    });

    it(`should return status 401 if no authorization is passed`, async () => {
        const response = await request(app).get(path);
        expect(response.status).toBe(401);
    });

    it(`should return status 500 if an invalid user is passed`, async () => {
        console.warn(
            "This test cannot be implemented until JWT decryption is added.",
        );
    });

    it("should return 200 for a valid user with the appropriate bookmarks", async () => {
        const response = await request(app)
            .get(path)
            .set("Authorization", USER_JWT);

        expect(response.statusCode).toBe(200);
    });
});

describe("POST /api/bookmarks", () => {
    let path = "/api/bookmarks";
    let REAL_EVENT_ID: string;
    let USER_JWT: string;
    let USER_ID: string;

    beforeAll(async () => {
        REAL_EVENT_ID = await generator.generateEvent();
        let user = await generator.generateUser({ withSession: true });

        USER_JWT = "Bearer " + user.jwt!;
        USER_ID = user.id;
    });

    it("should return status 401 if no authorization is passed", async () => {
        const response = await request(app)
            .post(path)
            .send({ eventId: INVALID_EVENT_ID });
        expect(response.statusCode).toBe(401);
    });

    it("should return status 400 if no event id is passed", async () => {
        const response = await request(app)
            .post(path)
            .set("Authorization", USER_JWT)
            .send({});

        expect(response.statusCode).toBe(400);
    });

    it("should return status 500 if an invalid event id is passed", async () => {
        const response = await request(app)
            .post(path)
            .set("Authorization", USER_JWT)
            .send({ eventId: INVALID_EVENT_ID });

        expect(response.statusCode).toBe(500);
    });

    it("should return status 401 if an invalid user token is passed", async () => {
        // Invalid token fails authentication before reaching bookmark logic
        const response = await request(app)
            .post(path)
            .set("Authorization", "Token with invalid user id")
            .send({ eventId: INVALID_EVENT_ID });

        expect(response.statusCode).toBe(401);
    });

    it("should return status 200 for a valid user and event", async () => {
        // note: this test will create a bookmark row in the database
        const response = await request(app)
            .post(path)
            .set("Authorization", USER_JWT)
            .send({ eventId: REAL_EVENT_ID });

        expect(response.statusCode).toBe(200);

        generator.logBookmark(USER_ID, REAL_EVENT_ID);
    });
});

describe("DELETE /api/bookmarks", () => {
    let path = "/api/bookmarks";
    let bookmarked_event: string;
    let non_bookmarked_event: string;
    let user_jwt: string;

    beforeAll(async () => {
        let bookmark = await generator.generateBookmark({ withSession: true });
        bookmarked_event = bookmark[1];
        non_bookmarked_event = await generator.generateEvent();
        user_jwt = "Bearer " + bookmark[0].jwt!;
    });

    it("should return status 401 if no authorization is passed", async () => {
        const response = await request(app)
            .delete(path)
            .send({ eventId: INVALID_EVENT_ID });
        expect(response.statusCode).toBe(401);
    });

    it("should return status 400 if no event id is passed", async () => {
        const response = await request(app)
            .delete(path)
            .set("Authorization", user_jwt)
            .send({});

        expect(response.statusCode).toBe(400);
    });

    it("should return status 500 if an invalid event id is passed", async () => {
        const response = await request(app)
            .delete(path)
            .set("Authorization", user_jwt)
            .send({ eventId: INVALID_EVENT_ID });

        expect(response.statusCode).toBe(500);
    });

    it("should return status 401 if an invalid user token is passed", async () => {
        // invalid token fails authentication before reaching bookmarkService logic
        const response = await request(app)
            .delete(path)
            .set("Authorization", "Token with invalid user id")
            .send({ eventId: INVALID_EVENT_ID });

        expect(response.statusCode).toBe(401);
    });

    it("should return status 500 if the user does not have this event bookmarked", async () => {
        const response = await request(app)
            .delete(path)
            .set("Authorization", user_jwt)
            .send({ eventId: non_bookmarked_event });

        expect(response.statusCode).toBe(500);
    });

    it("should return status 200 for a valid user and event", async () => {
        const response = await request(app)
            .delete(path)
            .set("Authorization", user_jwt)
            .send({ eventId: bookmarked_event });

        expect(response.statusCode).toBe(200);
    });
});

afterAll(() => {
    generator.cleanUp();
});
