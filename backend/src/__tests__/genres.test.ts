import request from "supertest";
import { describe, it, expect, afterAll } from "@jest/globals";
import app from "../app.js";
import { strictMatchFields } from "../utils/cmp.js";
import { db } from "../db/supabaseClient.js";

let createdIds: string[] = [];

const logCreatedId = (response: any) => {
    if (response.body == undefined) {
        return;
    }

    if (response.body.id == undefined) {
        return;
    }

    createdIds.push(response.body.id);
};

const genresAreEqual = (genreA: any, genreB: any) =>
    strictMatchFields(genreA, genreB, ["id", "name"]);

describe("GET /api/genres", () => {
    const path = "/api/genres";

    it("should return the genre if a valid name is given", async () => {
        let response = await request(app).get(path + "?name=Electronic");

        let genre = {
            name: "Electronic",
            id: "0049ad43-60b4-4507-bf3c-87980a3d9702",
        };

        expect(response.statusCode).toBe(200);
        expect(genresAreEqual(genre, response.body.genre));
        expect(response.body.genres).not.toBeDefined();
        expect(response.body.error).not.toBeDefined();
    });

    it("should return 500 if an invalid name is given", async () => {
        let response = await request(app).get(path + "?name=INVALID-GENRE");

        expect(response.statusCode).toBe(500);
        expect(response.body.genre).not.toBeDefined();
        expect(response.body.genres).not.toBeDefined();
        expect(response.body.error).toBeDefined();
    });

    it("should return all genres if no name is given", async () => {
        let response = await request(app).get(path);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.genres)).toBe(true);
        expect(response.body.genres.length).toBeGreaterThan(0);
        expect(response.body.count).toBe(response.body.genres.length);
    });
});

describe("POST /api/genres", () => {
    const path = "/api/genres";

    it("should return 400 if no name is passed", async () => {
        let response = await request(app).post(path).send({});

        logCreatedId(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Name is missing");
    });

    it("should return 500 if an existing name is passed", async () => {
        let response = await request(app)
            .post(path)
            .send({ name: "Electronic" });

        logCreatedId(response);

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
    });

    it("should return 200 if a unique name is passed", async () => {
        const genreName =
            "POST-GENRE-TEST-" + String(Math.floor(Math.random() * 1e10));
        let response = await request(app).post(path).send({ name: genreName });

        logCreatedId(response);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.id).toBeDefined();

        // Verify the genre was created by fetching it from the database
        const { data: createdGenre, error } =
            await db.genres.getByName(genreName);

        expect(createdGenre).toBeDefined();
        expect(createdGenre.name).toBe(genreName);
    });
});

afterAll(async () => {
    for (let i = 0; i < createdIds.length; i++) {
        let id = createdIds[i]!;

        console.log("Cleaning up genre: ", id);
        await db.genres.deleteById(id);
    }
});
