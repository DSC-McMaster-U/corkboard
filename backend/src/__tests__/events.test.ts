import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
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

describe("GET /api/events/:id", () => {
    const path = "/api/events";
    let eventId: string;

    beforeAll(async () => {
        eventId = await generator.generateEvent();
    });

    describe("Input validation", () => {
        it("should return 404 for a non-existent but valid UUID", async () => {
            const response = await request(app).get(
                `${path}/00000000-0000-0000-0000-000000000000`,
            );

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe("Event not found");
        });

        it("should return 404 for an invalid (non-UUID) event ID", async () => {
            const response = await request(app).get(`${path}/not-a-valid-id`);

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe("Event not found");
        });

        it("should return 200 for a valid existing event ID", async () => {
            const response = await request(app).get(`${path}/${eventId}`);

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let event: Event;

        beforeAll(async () => {
            const response = await request(app).get(`${path}/${eventId}`);
            event = response.body.event;
        });

        it("should return the event nested under an 'event' key", () => {
            expect(event).toBeDefined();
        });

        it("should include expected top-level event fields", () => {
            expect(event.id).toBeDefined();
            expect(event.title).toBeDefined();
            expect(event.start_time).toBeDefined();
            expect(event.created_at).toBeDefined();
        });

        it("should return the correct event ID matching the request", () => {
            expect(event.id).toBe(eventId);
        });

        it("should include a venues object with expected fields", () => {
            expect(event.venues).toBeDefined();
            expect(event.venues.id).toBeDefined();
            expect(event.venues.name).toBeDefined();
        });

        it("should include an event_genres array", () => {
            expect(event.event_genres).toBeDefined();
            expect(Array.isArray(event.event_genres)).toBe(true);
        });
    });

    describe("Data propagation", () => {
        it("should return event fields that match the database record", async () => {
            const response = await request(app).get(`${path}/${eventId}`);
            const eventFromApi = response.body.event;

            const { data: eventFromDb } = await db.events.getById(eventId);

            expect(eventFromApi.id).toBe(eventFromDb!.id);
            expect(eventFromApi.title).toBe(eventFromDb!.title);
            expect(eventFromApi.start_time).toBe(eventFromDb!.start_time);
            expect(eventFromApi.cost).toBe(eventFromDb!.cost);
            expect(eventFromApi.status).toBe(eventFromDb!.status);
        });

        it("should return venue data matching the database record", async () => {
            const response = await request(app).get(`${path}/${eventId}`);
            const eventFromApi = response.body.event;

            const { data: eventFromDb } = await db.events.getById(eventId);

            expect(eventFromApi.venues.id).toBe(eventFromDb!.venues!.id);
            expect(eventFromApi.venues.name).toBe(eventFromDb!.venues!.name);
        });
    });
});

describe("POST /api/events/updateEvent", () => {
    const path = "/api/events/updateEvent";
    let eventId: string;
    let newVenueId: string;

    beforeAll(async () => {
        eventId = await generator.generateEvent();
        newVenueId = await generator.generateVenue();
    });

    describe("Input validation", () => {
        it("should return 400 if no id is provided", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ title: "Updated Title" });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 400 if id is an empty string", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: "", title: "Updated Title" });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 500 for a non-existent event ID", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({
                    id: "00000000-0000-0000-0000-000000000000",
                    title: "Updated Title",
                });

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });

        it("should return 200 for a valid event ID with a title update", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: eventId, title: "Valid Update" });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 200 when updating multiple optional fields", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({
                    id: eventId,
                    title: "Multi-field Update",
                    description: "Updated description",
                    cost: 15,
                    status: "published",
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("Output validation", () => {
        let response: any;

        beforeAll(async () => {
            response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: eventId, title: "Output Validation Title" });
        });

        it("should return status 200", () => {
            expect(response.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(response.body.success).toBe(true);
        });

        it("should return the id of the updated event", () => {
            expect(response.body.id).toBeDefined();
            expect(response.body.id).toBe(eventId);
        });
    });

    describe("Data propagation", () => {
        it("should persist changes to the database", async () => {
            const newTitle = "Propagation Test Title";
            const newDescription = "Propagation Test Description";
            const newCost = 25;
            const newStatus = "hidden";

            await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({
                    id: eventId,
                    title: newTitle,
                    description: newDescription,
                    cost: newCost,
                    status: newStatus,
                });

            const { data } = await db.events.getById(eventId);
            expect(data!.title).toBe(newTitle);
            expect(data!.description).toBe(newDescription);
            expect(data!.cost).toBe(newCost);
            expect(data!.status).toBe(newStatus);
        });

        it("should persist venue changes", async () => {
            await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({
                    id: eventId,
                    venue_id: newVenueId,
                });

            const { data } = await db.events.getById(eventId);
            const { data: venue } = await db.venues.getById(newVenueId);

            expect(data!.venues.title).toBe(venue.title);
        });
    });
});

describe("DELETE /api/events/deleteEvent", () => {
    const path = "/api/events/deleteEvent";
    let eventId: string;

    beforeAll(async () => {
        eventId = await generator.generateEvent();
    });

    describe("Input validation", () => {
        it("should return 400 if no id is provided", async () => {
            const response = await request(app)
                .delete(path)
                .set("Authorization", bypassUserToken)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 400 if id is an empty string", async () => {
            const response = await request(app)
                .delete(path)
                .set("Authorization", bypassUserToken)
                .send({ id: "" });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 200 for a valid event ID", async () => {
            const tempEventId = await generator.generateEvent();

            const response = await request(app)
                .delete(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let response: any;

        beforeAll(async () => {
            const tempEventId = await generator.generateEvent();

            response = await request(app)
                .delete(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });
        });

        it("should return status 200", () => {
            expect(response.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(response.body.success).toBe(true);
        });
    });

    describe("Data propagation", () => {
        it("should remove the event from the database", async () => {
            const tempEventId = await generator.generateEvent();

            await request(app)
                .delete(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            const { data } = await db.events.getById(tempEventId);
            expect(data).toBeNull();
        });

        it("should not affect other events in the database", async () => {
            const tempEventId = await generator.generateEvent();

            await request(app)
                .delete(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            const { data } = await db.events.getById(eventId);
            expect(data).not.toBeNull();
            expect(data!.id).toBe(eventId);
        });
    });
});

describe("POST /api/events/archiveEvent", () => {
    const path = "/api/events/archiveEvent";
    let eventId: string;

    beforeAll(async () => {
        eventId = await generator.generateEvent();
    });

    describe("Input validation", () => {
        it("should return 400 if no id is provided", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 400 if id is an empty string", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: "" });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 200 for a valid event ID", async () => {
            const tempEventId = await generator.generateEvent();

            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let response: any;

        beforeAll(async () => {
            const tempEventId = await generator.generateEvent();

            response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });
        });

        it("should return status 200", () => {
            expect(response.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(response.body.success).toBe(true);
        });
    });

    describe("Data propagation", () => {
        it("should set archived to true in the database", async () => {
            const tempEventId = await generator.generateEvent();

            await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            const { data } = await db.events.getById(tempEventId);
            expect(data).not.toBeNull();
            expect(data!.archived).toBe(true);
        });

        it("should not affect other events in the database", async () => {
            const tempEventId = await generator.generateEvent();

            await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            const { data } = await db.events.getById(eventId);
            expect(data).not.toBeNull();
            expect(data!.archived).toBe(false);
        });
    });
});

describe("POST /api/events/unarchiveEvent", () => {
    const path = "/api/events/unarchiveEvent";
    let archivedEventId: string;

    beforeAll(async () => {
        archivedEventId = await generator.generateEvent();
        await request(app)
            .post("/api/events/archiveEvent")
            .set("Authorization", bypassUserToken)
            .send({ id: archivedEventId });
    });

    describe("Input validation", () => {
        it("should return 400 if no id is provided", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 400 if id is an empty string", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: "" });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID is missing");
        });

        it("should return 200 for a valid event ID", async () => {
            const tempEventId = await generator.generateEvent();
            await request(app)
                .post("/api/events/archiveEvent")
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let response: any;

        beforeAll(async () => {
            const tempEventId = await generator.generateEvent();
            await request(app)
                .post("/api/events/archiveEvent")
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });
        });

        it("should return status 200", () => {
            expect(response.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(response.body.success).toBe(true);
        });
    });

    describe("Data propagation", () => {
        it("should set archived to false in the database", async () => {
            const tempEventId = await generator.generateEvent();
            await request(app)
                .post("/api/events/archiveEvent")
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            const { data } = await db.events.getById(tempEventId);
            expect(data).not.toBeNull();
            expect(data!.archived).toBe(false);
        });

        it("should not affect other archived events in the database", async () => {
            const tempEventId = await generator.generateEvent();
            await request(app)
                .post("/api/events/archiveEvent")
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ id: tempEventId });

            const { data } = await db.events.getById(archivedEventId);
            expect(data).not.toBeNull();
            expect(data!.archived).toBe(true);
        });
    });
});

// Skipping for now until it is confirmed that arbitrary calls to this endpoint are safe
describe.skip("POST /api/events/archivePastEvents", () => {
    const path = "/api/events/archivePastEvents";

    describe("Input validation", () => {
        it("should return 200 when called with no body", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken);

            expect(response.statusCode).toBe(200);
        });

        it("should return 200 when called with an arbitrary body (extra fields are ignored)", async () => {
            const response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken)
                .send({ irrelevant_field: "should be ignored", id: "ignored" });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let response: any;

        beforeAll(async () => {
            response = await request(app)
                .post(path)
                .set("Authorization", bypassUserToken);
        });

        it("should return status 200", () => {
            expect(response.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(response.body.success).toBe(true);
        });
    });

    describe("Data propagation", () => {
        it("should archive events with a start_time in the past", async () => {
            const pastEventId = await generator.generateEvent({
                dateRange: [-5, -1],
            });

            await request(app).post(path).set("Authorization", bypassUserToken);

            const { data } = await db.events.getById(pastEventId);
            expect(data).not.toBeNull();
            expect(data!.archived).toBe(true);
        });

        it("should not archive events with a start_time in the future", async () => {
            const futureEventId = await generator.generateEvent({
                dateRange: [1, 10],
            });

            await request(app).post(path).set("Authorization", bypassUserToken);

            const { data } = await db.events.getById(futureEventId);
            expect(data).not.toBeNull();
            expect(data!.archived).toBe(false);
        });

        it("should leave already-archived past events as archived", async () => {
            const pastEventId = await generator.generateEvent({
                dateRange: [-5, -1],
            });

            // Archive it first via the archiveEvent endpoint
            await request(app)
                .post("/api/events/archiveEvent")
                .set("Authorization", bypassUserToken)
                .send({ id: pastEventId });

            // archivePastEvents should not unarchive it
            await request(app).post(path).set("Authorization", bypassUserToken);

            const { data } = await db.events.getById(pastEventId);
            expect(data).not.toBeNull();
            expect(data!.archived).toBe(true);
        });

        it("should not affect unarchived future events when past events are present", async () => {
            const pastEventId = await generator.generateEvent({
                dateRange: [-5, -1],
            });
            const futureEventId = await generator.generateEvent({
                dateRange: [1, 10],
            });

            await request(app).post(path).set("Authorization", bypassUserToken);

            const { data: pastData } = await db.events.getById(pastEventId);
            const { data: futureData } = await db.events.getById(futureEventId);

            expect(pastData!.archived).toBe(true);
            expect(futureData!.archived).toBe(false);
        });
    });
});

describe("POST /api/events/:id/genres", () => {
    const path = (id: string) => `/api/events/${id}/genres`;
    let eventId: string;
    let genreId: string;

    beforeAll(async () => {
        eventId = await generator.generateEvent();
        genreId = await generator.generateGenre();
    });

    describe("Input validation", () => {
        it("should return 400 if genreId is missing from the body", async () => {
            const response = await request(app)
                .post(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Event ID or Genre ID missing");
        });

        it("should return 500 for a non-existent event ID", async () => {
            const response = await request(app)
                .post(path("00000000-0000-0000-0000-000000000000"))
                .set("Authorization", bypassUserToken)
                .send({ genreId });

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });

        it("should return 500 for a non-existent genre ID", async () => {
            const response = await request(app)
                .post(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreId: "00000000-0000-0000-0000-000000000000" });

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });

        it("should return 200 for a valid event ID and genre ID", async () => {
            const validGenreId = await generator.generateGenre();

            const response = await request(app)
                .post(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreId: validGenreId });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let response: any;
        let outputGenreId: string;

        beforeAll(async () => {
            outputGenreId = await generator.generateGenre();
            response = await request(app)
                .post(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreId: outputGenreId });
        });

        it("should return status 200", () => {
            expect(response.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(response.body.success).toBe(true);
        });

        it("should return a data object", () => {
            expect(response.body.data).toBeDefined();
        });

        it("should return data.event_id matching the path parameter", () => {
            expect(response.body.data.event_id).toBe(eventId);
        });

        it("should return data.genre_id matching the request body", () => {
            expect(response.body.data.genre_id).toBe(outputGenreId);
        });
    });

    describe("Data propagation", () => {
        it("should add the genre to the event in the database", async () => {
            const newEventId = await generator.generateEvent();
            const newGenreId = await generator.generateGenre();

            await request(app)
                .post(path(newEventId))
                .set("Authorization", bypassUserToken)
                .send({ genreId: newGenreId });

            const { data } = await db.events.getById(newEventId);
            const eventGenres = data?.event_genres ?? [];
            const addedGenre = eventGenres.find(
                (eg: any) => eg.genre_id === newGenreId,
            );

            expect(addedGenre).toBeDefined();
        });

        it("should not modify the genres of other events", async () => {
            const unaffectedEventId = await generator.generateEvent();
            const newGenreId = await generator.generateGenre();

            const { data: before } = await db.events.getById(unaffectedEventId);
            const genreCountBefore = before?.event_genres?.length ?? 0;

            await request(app)
                .post(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreId: newGenreId });

            const { data: after } = await db.events.getById(unaffectedEventId);
            const genreCountAfter = after?.event_genres?.length ?? 0;

            expect(genreCountAfter).toBe(genreCountBefore);
        });
    });
});

describe("DELETE /api/events/:id/genres/:genreId", () => {
    const path = (id: string, genreId: string) =>
        `/api/events/${id}/genres/${genreId}`;
    let eventId: string;
    let genreId: string;

    beforeAll(async () => {
        eventId = await generator.generateEvent();
        genreId = await generator.generateGenre();
        await db.events.addGenre(eventId, genreId);
    });

    describe("Input validation", () => {
        it("should return 200 for a valid event ID and genre ID", async () => {
            const tmpGenreId = await generator.generateGenre();
            await db.events.addGenre(eventId, tmpGenreId);

            const response = await request(app)
                .delete(path(eventId, tmpGenreId))
                .set("Authorization", bypassUserToken);

            expect(response.statusCode).toBe(200);
        });

        it("should return 200 for a non-existent event ID (no-op delete)", async () => {
            const response = await request(app)
                .delete(path("00000000-0000-0000-0000-000000000000", genreId))
                .set("Authorization", bypassUserToken);

            expect(response.statusCode).toBe(200);
        });

        it("should return 200 for a non-existent genre ID (no-op delete)", async () => {
            const response = await request(app)
                .delete(path(eventId, "00000000-0000-0000-0000-000000000000"))
                .set("Authorization", bypassUserToken);

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let response: any;

        beforeAll(async () => {
            const outputGenreId = await generator.generateGenre();
            await db.events.addGenre(eventId, outputGenreId);

            response = await request(app)
                .delete(path(eventId, outputGenreId))
                .set("Authorization", bypassUserToken);
        });

        it("should return status 200", () => {
            expect(response.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(response.body.success).toBe(true);
        });

        it("should not return a data field", () => {
            expect(response.body.data).toBeUndefined();
        });
    });

    describe("Data propagation", () => {
        it("should remove the genre from the event in the database", async () => {
            const newEventId = await generator.generateEvent();
            const newGenreId = await generator.generateGenre();

            await db.events.addGenre(newEventId, newGenreId);

            await request(app)
                .delete(path(newEventId, newGenreId))
                .set("Authorization", bypassUserToken);

            const { data } = await db.events.getById(newEventId);
            const eventGenres = data?.event_genres ?? [];
            const removedGenre = eventGenres.find(
                (eg: any) => eg.genre_id === newGenreId,
            );

            expect(removedGenre).toBeUndefined();
        });

        it("should not modify the genres of other events", async () => {
            const unaffectedEventId = await generator.generateEvent();
            const sharedGenreId = await generator.generateGenre();

            await db.events.addGenre(eventId, sharedGenreId);
            await db.events.addGenre(unaffectedEventId, sharedGenreId);

            const { data: before } = await db.events.getById(unaffectedEventId);
            const genreCountBefore = before?.event_genres?.length ?? 0;

            await request(app)
                .delete(path(eventId, sharedGenreId))
                .set("Authorization", bypassUserToken);

            const { data: after } = await db.events.getById(unaffectedEventId);
            const genreCountAfter = after?.event_genres?.length ?? 0;

            expect(genreCountAfter).toBe(genreCountBefore);
        });
    });
});

describe("PUT /api/events/:id/genres", () => {
    const path = (id: string) => `/api/events/${id}/genres`;
    let eventId: string;
    let genreId: string;

    beforeAll(async () => {
        eventId = await generator.generateEvent();
        genreId = await generator.generateGenre();
        await db.events.addGenre(eventId, genreId);
    });

    describe("Input validation", () => {
        it("should return 400 if genreIds is missing from the body", async () => {
            const response = await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe(
                "Event ID missing or genreIds is not an array",
            );
        });

        it("should return 400 if genreIds is a string instead of an array", async () => {
            const response = await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: genreId });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe(
                "Event ID missing or genreIds is not an array",
            );
        });

        it("should return 400 if genreIds is null", async () => {
            const response = await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: null });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe(
                "Event ID missing or genreIds is not an array",
            );
        });

        it("should return 200 for a valid event ID with an empty genreIds array", async () => {
            const response = await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [] });

            expect(response.statusCode).toBe(200);
        });

        it("should return 200 for a valid event ID with a valid genreIds array", async () => {
            const newGenreId = await generator.generateGenre();

            const response = await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [newGenreId] });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Output validation", () => {
        let responseWithGenres: any;
        let responseEmpty: any;
        let outputGenreId: string;

        beforeAll(async () => {
            outputGenreId = await generator.generateGenre();

            responseWithGenres = await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [outputGenreId] });

            responseEmpty = await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [] });
        });

        it("should return status 200", () => {
            expect(responseWithGenres.statusCode).toBe(200);
        });

        it("should return success: true", () => {
            expect(responseWithGenres.body.success).toBe(true);
        });

        it("should return a data array", () => {
            expect(Array.isArray(responseWithGenres.body.data)).toBe(true);
        });

        it("should return a data array with one entry per genre provided", () => {
            expect(responseWithGenres.body.data).toHaveLength(1);
        });

        it("should return data entries with event_id matching the path parameter", () => {
            expect(responseWithGenres.body.data[0].event_id).toBe(eventId);
        });

        it("should return data entries with genre_id matching the provided genre IDs", () => {
            expect(responseWithGenres.body.data[0].genre_id).toBe(
                outputGenreId,
            );
        });

        it("should return an empty data array when genreIds is empty", () => {
            expect(responseEmpty.body.success).toBe(true);
            expect(responseEmpty.body.data).toEqual([]);
        });
    });

    describe("Data propagation", () => {
        it("should replace existing genres with the new set", async () => {
            const targetEventId = await generator.generateEvent();
            const oldGenreId = await generator.generateGenre();
            const newGenreId = await generator.generateGenre();

            await db.events.addGenre(targetEventId, oldGenreId);

            await request(app)
                .put(path(targetEventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [newGenreId] });

            const { data } = await db.events.getById(targetEventId);
            const eventGenres = data?.event_genres ?? [];

            const oldGenrePresent = eventGenres.find(
                (eg: any) => eg.genre_id === oldGenreId,
            );
            const newGenrePresent = eventGenres.find(
                (eg: any) => eg.genre_id === newGenreId,
            );

            expect(oldGenrePresent).toBeUndefined();
            expect(newGenrePresent).toBeDefined();
        });

        it("should remove all genres from the event when given an empty array", async () => {
            const targetEventId = await generator.generateEvent();
            const existingGenreId = await generator.generateGenre();

            await db.events.addGenre(targetEventId, existingGenreId);

            await request(app)
                .put(path(targetEventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [] });

            const { data } = await db.events.getById(targetEventId);
            const eventGenres = data?.event_genres ?? [];

            expect(eventGenres).toHaveLength(0);
        });

        it("should persist multiple genres when given an array with multiple IDs", async () => {
            const targetEventId = await generator.generateEvent();
            const firstGenreId = await generator.generateGenre();
            const secondGenreId = await generator.generateGenre();

            await request(app)
                .put(path(targetEventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [firstGenreId, secondGenreId] });

            const { data } = await db.events.getById(targetEventId);
            const eventGenres = data?.event_genres ?? [];
            const genreIds = eventGenres.map((eg: any) => eg.genre_id);

            expect(genreIds).toContain(firstGenreId);
            expect(genreIds).toContain(secondGenreId);
        });

        it("should not modify the genres of other events", async () => {
            const unaffectedEventId = await generator.generateEvent();
            const unaffectedGenreId = await generator.generateGenre();
            await db.events.addGenre(unaffectedEventId, unaffectedGenreId);

            const { data: before } = await db.events.getById(unaffectedEventId);
            const genreCountBefore = before?.event_genres?.length ?? 0;

            const newGenreId = await generator.generateGenre();
            await request(app)
                .put(path(eventId))
                .set("Authorization", bypassUserToken)
                .send({ genreIds: [newGenreId] });

            const { data: after } = await db.events.getById(unaffectedEventId);
            const genreCountAfter = after?.event_genres?.length ?? 0;

            expect(genreCountAfter).toBe(genreCountBefore);
        });
    });
});

afterAll(async () => {
    await generator.cleanUp();

    for (let i = 0; i < createdIds.length; i++) {
        let id = createdIds[i]!;

        console.log("Cleaning up event: ", id);
        await db.events.deleteById(id);
    }
});
