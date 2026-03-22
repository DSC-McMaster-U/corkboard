import request from "supertest";
import { describe, it, expect, afterAll } from "@jest/globals";
import app from "../app.js";
import { db } from "../db/supabaseClient.js";
import { strictMatchFields } from "../utils/cmp.js";
import { parseDateOr } from "../utils/parser.js";
import { tomorrow } from "../utils/time.js";
import { Generator } from "../utils/generator.js";

// TODO: Replace the bypass token with an actual token for a test user
let bypassUserToken = "TESTING_BYPASS";

type Event = {
    id: string; // UUID
    title: string;
    description: string | undefined;
    start_time: string;
    cost: number | undefined; // Can be null
    status: string;
    created_at: string;
    source_type: string | undefined;
    source_url: string | undefined;
    artist_id: string | undefined;
    image: string | undefined;
    archived: boolean | undefined;
    venues: {
        id: string;
        name: string;
        address: string | undefined;
        venue_type: string | undefined;
        latitude: number | undefined;
        longitude: number | undefined;
    };
    artists:
        | {
              id: string;
              name: string;
              bio: string | undefined;
              image: string | undefined;
          }
        | null
        | undefined;
    event_genres:
        | Array<{
              genre_id: string;
              genres: {
                  id: string;
                  name: string;
              };
          }>
        | undefined;
};

const generator = new Generator();

let createdIds: Array<string> = [];

const logId = (response: any) => {
    if (response.body == undefined) {
        return;
    }

    if (response.body.id == undefined) {
        return;
    }

    createdIds.push(response.body.id);
};

describe("GET /api/events/", () => {
    let path = "/api/events";

    it("should return at most 20 events if no limit is provided", async () => {
        let response = await request(app).get(path + "?include_archived=true");

        let count: number = response.body.count;
        let events: Array<Event> = response.body.events;

        expect(count).toBeLessThanOrEqual(20);
        expect(count).toBeGreaterThan(0);
        expect(events.length).toBe(count);
    });

    it("should return at most the amount of events defined in by the limit", async () => {
        let limit = 2;
        let response = await request(app).get(
            path + `?limit=${limit}&include_archived=true`,
        );

        let count: number = response.body.count;
        let events: Array<Event> = response.body.events;

        expect(count).toBeLessThanOrEqual(limit);
        expect(count).toBeGreaterThan(0);
        expect(events.length).toBe(count);
    });

    it("should only return events later than the start date range", async () => {
        let min_start_time = new Date();
        min_start_time.setDate(min_start_time.getDate() + 10);
        let response = await request(app).get(
            path +
                `?min_start_time=${min_start_time.toISOString()}&include_archived=true`,
        );

        let events: Array<Event> = response.body.events;

        expect(response.body.count).toBeGreaterThan(0);

        events.forEach((event) => {
            expect(new Date(event.start_time).getTime()).toBeGreaterThanOrEqual(
                min_start_time.getTime(),
            );
        });
    });

    it("should only return events before than the end date range", async () => {
        let max_start_time = new Date();
        max_start_time.setDate(max_start_time.getDate() + 10);
        let response = await request(app).get(
            path +
                `?max_start_time=${max_start_time.toISOString()}&include_archived=true`,
        );

        let events: Array<Event> = response.body.events;

        expect(response.body.count).toBeGreaterThan(0);

        events.forEach((event) => {
            expect(new Date(event.start_time).getTime()).toBeLessThanOrEqual(
                max_start_time.getTime(),
            );
        });
    });

    it("should only return events as or more expensive than the min cost", async () => {
        let min_cost = 15;
        let response = await request(app).get(
            path + `?min_cost=${min_cost}&include_archived=true`,
        );

        let events: Array<Event> = response.body.events;

        expect(events.length).toBeGreaterThan(0);

        events.forEach((event) => {
            // Null costs should be included, so they are just checked as min_cost
            expect(event.cost ?? min_cost).toBeGreaterThanOrEqual(min_cost);
        });
    });

    it("should only return events as or less expensive than the max cost", async () => {
        let max_cost = 15;
        let response = await request(app).get(
            path + `?max_cost=${max_cost}&include_archived=true`,
        );

        let events: Array<Event> = response.body.events;

        expect(events.length).toBeGreaterThan(0);

        events.forEach((event) => {
            // Null costs should be included sho they are just checked as max_cost
            expect(event.cost ?? max_cost).toBeLessThanOrEqual(max_cost);
        });
    });

    it("should only return events within the radius of the location", async () => {
        console.warn(
            "This test is not implemented, will be implemented in MVP 2",
        );
    });

    it("should only return events within the 10km of the Hamilton if no location is provided", async () => {
        console.warn(
            "This test is not implemented, will be implemented in MVP 2",
        );
    });

    it("should not return empty data for required fields", async () => {
        let response = await request(app).get(
            path + "?limit=100&include_archived=true",
        );

        let events: Array<Event> = response.body.events;

        expect(events.length).toBeGreaterThan(0);

        for (let i = 0; i < events.length; i++) {
            let event = events[i]!;

            expect(event.id).not.toBe("");
            expect(parseDateOr(event.created_at, new Date("1970"))).not.toBe(
                new Date("1970"),
            );
            expect(event.venues.id).not.toBe("");
            expect(event.venues.name).not.toBe("");
        }
    });

    it("should return an event matching the given criteria", async () => {
        let dateRange: [number, number] = [1, 10];
        let costRange: [number, number] = [5, 10];

        let start_time = new Date();
        start_time.setDate(start_time.getDate() + dateRange[0]);
        let end_time = new Date();
        end_time.setDate(end_time.getDate() + dateRange[1]);

        let event_count = 20;

        for (let i = 0; i < event_count; i++) {
            await generator.generateEvent({
                dateRange,
                costRange,
            });
        }

        let response = await request(app).get(
            path +
                `?limit=${event_count}&min_cost=${costRange[0]}&max_cost=${costRange[1]}&min_start_time=${start_time.toISOString()}&max_start_time=${end_time.toISOString()}&include_archived=true`,
        );

        let events: Array<Event> = response.body.events;

        expect(events.length).toBe(event_count);

        // Commenting out as this is dependent on real event info
        /* 
        let found = false;

        for (let i = 0; i < events.length; i++) {
            let event = events[i]!;

            if (event.id !== "a4e66b5f-4f1f-4d5a-9813-579a3436dbe2") {
                continue;
            }

            // Event Field Verification
            expect(event.title).toBe("Electronic Showcase");
            expect(event.description).toBe("Electronic music showcase");
            expect(event.cost).toBe(20);
            expect(event.start_time).toBe("2025-10-27T23:37:49.998663+00:00");
            expect(event.status).toBe("published");
            expect(event.created_at).toBe("2025-10-26T23:37:49.998663");
            expect(event.source_type).toBe("manual");
            expect(event.source_url).toBeNull();
            expect(event.artists).toBeDefined();
            if (event.artists) {
                expect(event.artists.name).toBe("Hamilton's Finest");
            }
            expect(event.image).toBe(
                "https://dniawpahwcqtvcnaaexv.supabase.co/storage/v1/object/public/events/images/events/the-underground-maybe.jpg",
            );

            // Venue Verification
            expect(event.venues.id).toBe(
                "b28f8296-005a-48f1-b8ed-47a13fca3215",
            );
            expect(event.venues.name).toBe("The Underground");
            expect(event.venues.address).toBe("123 James St N, Hamilton, ON");
            expect(event.venues.venue_type).toBe("bar");
            expect(event.venues.latitude).toBe(43.2577778);
            expect(event.venues.longitude).toBe(-79.8744444);

            // Genre Verification
            let sortedGenres = [...event.event_genres!].sort();

            expect(sortedGenres[0]?.genre_id).toBe(
                "0049ad43-60b4-4507-bf3c-87980a3d9702",
            );
            expect(sortedGenres[0]?.genres.id).toBe(
                "0049ad43-60b4-4507-bf3c-87980a3d9702",
            );
            expect(sortedGenres[0]?.genres.name).toBe("Electronic");
            expect(sortedGenres[1]?.genre_id).toBe(
                "867e8b7b-9f23-4cb4-b9f5-731a4ba6e92e",
            );
            expect(sortedGenres[1]?.genres.id).toBe(
                "867e8b7b-9f23-4cb4-b9f5-731a4ba6e92e",
            );
            expect(sortedGenres[1]?.genres.name).toBe("Rock");

            found = true;
        }

        */

        //expect(found).toBe(true);
    });
});

describe("POST /api/events/", () => {
    let path = "/api/events";

    /*it("should return code 401 if no authorization is passed", async () => {
        const response = await request(app).post(path);

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });*/

    it("should return 400 if no title is passed", async () => {
        const response = await request(app)
            .post(path)
            .set("Authorization", bypassUserToken)
            .send({
                venue_id: "123e4567-e89b-12d3-a456-426614174000",
                start_time: new Date().toISOString(),
            });

        logId(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Title is missing");
    });

    it("should return 400 if no venue_id is passed", async () => {
        const response = await request(app)
            .post(path)
            .set("Authorization", bypassUserToken)
            .send({
                title: "Test Event",
                start_time: new Date().toISOString(),
            });

        logId(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Venue ID is missing");
    });

    it("should return 400 if no start_time is passed", async () => {
        const response = await request(app)
            .post(path)
            .set("Authorization", bypassUserToken)
            .send({
                title: "Test Event",
                venue_id: "123e4567-e89b-12d3-a456-426614174000",
            });

        logId(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Start time is missing");
    });

    it("should return 400 if an invalid start_time is passed", async () => {
        let invalidDate = new Date();

        const response = await request(app)
            .post(path)
            .set("Authorization", bypassUserToken)
            .send({
                title: "Test Event",
                venue_id: "123e4567-e89b-12d3-a456-426614174000",
                start_time: invalidDate.toISOString(),
            });

        logId(response);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid start time");
    });

    it("should return 500 and for an invalid venue_id", async () => {
        const response = await request(app)
            .post(path)
            .set("Authorization", bypassUserToken)
            .send({
                title: "Test Event",
                venue_id: "not-a-real-id",
                start_time: tomorrow().toISOString(),
                description: "Test Description",
                cost: 10,
                status: "active",
            });

        logId(response);

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
    });

    it("should return 200 and insert into the database if all arguments are passed with a valid venue_id", async () => {
        let eventId: string | undefined = undefined;

        const eventBody = {
            title: "Test Event",
            venue_id: "1154dd33-674e-4494-afac-594968579624",
            start_time: tomorrow().toISOString(),
            description: "Test Description",
            cost: 10,
            status: "published",
        };

        const response = await request(app)
            .post(path)
            .set("Authorization", bypassUserToken)
            .send(eventBody);

        logId(response);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        eventId = response.body.id;

        let inserted = await db.events.getById(eventId!);

        expect(
            strictMatchFields(eventBody, inserted.data, [
                "title",
                "venue_id",
                "start_time",
                "description",
                "cost",
                "status",
            ]),
        );
    });
});

describe("GET /api/events/:id", () => {});

describe("POST /api/events/updateEvent", () => {});

describe("DELETE /api/events/deleteEvent", () => {});

describe("POST /api/events/archiveEvent", () => {});

describe("POST /api/events/unarchiveEvent", () => {});

describe("POST /api/events/archivePastEvents", () => {});

describe("POST /api/events/:id/genres", () => {});

describe("DELETE /api/events/:id/genres/:genreId", () => {});

describe("PUT /api/events/:id/genres", () => {});

afterAll(async () => {
    await generator.cleanUp();

    for (let i = 0; i < createdIds.length; i++) {
        let id = createdIds[i]!;

        console.log("Cleaning up event: ", id);
        await db.events.deleteById(id);
    }
});
