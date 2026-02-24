import express from "express";
import type { Request, Response } from "express";
import { eventService } from "../services/eventService.js";
import { parseDateOr, parseFloatOr, parseIntOr } from "../utils/parser.js";
import { authService } from "../services/authService.js";

const router = express.Router();

// GET /api/events - Get all events matching given parameters
router.get("/", async (req: Request, res: Response) => {
    const limit = parseIntOr(req.query.limit as string | undefined, 20);

    const min_start_time = parseDateOr(
        req.query.min_start_time as string | undefined,
        new Date("1970-1-1")
    );

    const max_start_time = parseDateOr(
        req.query.max_start_time as string | undefined,
        new Date("2999-1-1")
    );

    const min_cost = parseFloatOr(req.query.min_cost as string | undefined, 0);

    const max_cost = parseFloatOr(
        req.query.max_cost as string | undefined,
        Number.MAX_VALUE
    );

    const latitude = parseFloatOr(
        req.query.latitude as string | undefined,
        43.2636408 // Hamilton, ON
    );

    const longitude = parseFloatOr(
        req.query.longitude as string | undefined,
        -79.9089415 // Hamilton, ON
    );

    const radius = parseIntOr(req.query.radius as string | undefined, 10);

    const includeArchived = req.query.includeArchived === "true";

    eventService
        .getAllEvents(
            limit,
            min_start_time.toISOString(),
            max_start_time.toISOString(),
            min_cost,
            max_cost,
            includeArchived
        )
        .then((events) => {
            res.status(200).json({ events: events, count: events.length });
        })
        .catch((err: Error) => {
            console.log("Error getting events: ", err);
            res.status(500).json({ error: err });
        });
});

router.post("/", async (req: Request, res: Response) => {
    req.body = req.body ?? {};

    const {
        title = undefined,
        description = undefined,
        venue_id = undefined,
        start_time = undefined,
        status = undefined,
        source_type = undefined,
        source_url = undefined,
        image = undefined,
        artist_id = undefined,
    } = req.body;

    const cost = parseFloatOr(req.body.cost, 0);

    /*if (authService.getUser(res) == undefined) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }*/ // Realized auth code is unnessecary here

    if (title == undefined || title === "") {
        res.status(400).json({ error: "Title is missing" });
        return;
    }

    if (venue_id == undefined || venue_id === "") {
        res.status(400).json({ error: "Venue ID is missing" });
        return;
    }

    if (start_time == undefined || start_time === "") {
        res.status(400).json({ error: "Start time is missing" });
        return;
    }

    let parsed_date = parseDateOr(start_time, new Date("1970-01-01"));

    // Current or previous dates are invalid
    if (parsed_date.getTime() <= new Date().getTime()) {
        res.status(400).json({ error: "Invalid start time" });
        return;
    }

    eventService
        .createEvent(
            title,
            venue_id,
            parsed_date.toISOString(),
            description,
            cost,
            status,
            source_type,
            source_url,
            image,
            artist_id
        )
        .then((result) => {
            res.status(200).json({ id: result.id, success: true });
        })
        .catch((err) => {
            res.status(500).json({ success: false, error: err });
        });
});

router.post("/updateEvent", async (req: Request, res: Response) => {
    req.body = req.body ?? {};

    const {
        id = undefined,
        title = undefined,
        description = undefined,
        venue_id = undefined,
        start_time = undefined,
        status = undefined,
        source_type = undefined,
        source_url = undefined,
        image = undefined,
        artist_id = undefined,
    } = req.body;
    
    const cost = parseFloatOr(req.body.cost, 0);

    if (id == undefined || id === "") {
        res.status(400).json({ error: "Event ID is missing" });
        return;
    }

    eventService.updateEventByID(id, {
        title,
        venue_id,
        start_time,
        description,
        cost,
        status,
        source_type,
        source_url,
        ingestion_status: "success",
        artist_id,
        image,
    })
    .then((result) => {
        res.status(200).json({ id: result.id, success: true });
    })
    .catch((err) => {
        res.status(500).json({ success: false, error: err });
    });
});

router.delete("/deleteEvent", async (req: Request, res: Response) => {
    const id = req.body.id as string | undefined;

    if (id == undefined || id === "") {
        res.status(400).json({ error: "Event ID is missing" });
        return;
    }

    eventService.deleteEventByID(id)
    .then(() => {
        res.status(200).json({ success: true });
    })
    .catch((err) => {
        res.status(500).json({ success: false, error: err });
    });
});

router.post("/archiveEvent", async (req: Request, res: Response) => {
    const id = req.body.id as string | undefined;
    
    if (id == undefined || id === "") {
        res.status(400).json({ error: "Event ID is missing" });
        return;
    }

    eventService.archiveEvent(id)
    .then(() => {
        res.status(200).json({ success: true });
    })
    .catch((err) => {
        res.status(500).json({ success: false, error: err });
    });
});

router.post("/unarchiveEvent", async (req: Request, res: Response) => {
    const id = req.body.id as string | undefined;
    
    if (id == undefined || id === "") {
        res.status(400).json({ error: "Event ID is missing" });
        return;
    }

    eventService.unarchiveEvent(id)
    .then(() => {
        res.status(200).json({ success: true });
    })
    .catch((err) => {
        res.status(500).json({ success: false, error: err });
    });
});


router.post("/archivePastEvents", async (req: Request, res: Response) => {
    eventService.archivePastEvents()
    .then(() => {
        res.status(200).json({ success: true });
    })
    .catch((err) => {
        res.status(500).json({ success: false, error: err });
    });
});


router.get("/userDrafts", async (req: Request, res: Response) => {
    const limit = parseIntOr(req.query.limit as string | undefined, 20);

    const min_start_time = parseDateOr(
        req.query.min_start_time as string | undefined,
        new Date("1970-1-1")
    );

    const max_start_time = parseDateOr(
        req.query.max_start_time as string | undefined,
        new Date("2999-1-1")
    );

    const min_cost = parseFloatOr(req.query.min_cost as string | undefined, 0);

    const max_cost = parseFloatOr(
        req.query.max_cost as string | undefined,
        Number.MAX_VALUE
    );

    eventService
        .getUserUploadedEvents(
            limit,
            min_start_time.toISOString(),
            max_start_time.toISOString(),
            min_cost,
            max_cost,
        )
        .then((events) => {
            res.status(200).json({ events: events, count: events.length });
        })
        .catch((err: Error) => {
            console.log("Error getting events: ", err);
            res.status(500).json({ error: err });
        });
});

router.post("/uploadDraft", async (req: Request, res: Response) => {
    req.body = req.body ?? {};

    const {
        user_id = undefined,
        title = undefined,
        venue_id = undefined,
        start_time = undefined,
        description = undefined,
        cost = undefined,
        image = undefined,
        artist_id = undefined,
    } = req.body;

    if (user_id == undefined || user_id === "") {
        res.status(400).json({ error: "User ID is missing" });
        return;
    }

    if (title == undefined || title === "") {
        res.status(400).json({ error: "Title is missing" });
        return;
    }

    if (venue_id == undefined || venue_id === "") {
        res.status(400).json({ error: "Venue ID is missing" });
        return;
    }

    if (start_time == undefined || start_time === "") {
        res.status(400).json({ error: "Start time is missing" });
        return;
    }

    let parsed_date = parseDateOr(start_time, new Date("1970-01-01"));

    // Current or previous dates are invalid
    if (parsed_date.getTime() <= new Date().getTime()) {
        res.status(400).json({ error: "Invalid start time" });
        return;
    }

    eventService
        .uploadUserEvent(
            user_id,
            title,
            venue_id,
            parsed_date.toISOString(),
            description,
            cost,
            image,
            artist_id
        )
        .then((result) => {
            res.status(200).json({ id: result.id, success: true });
        })
        .catch((err) => {
            res.status(500).json({ success: false, error: err });
        });
});



// Add more event routes here (POST, PUT, DELETE, ...)

export default router;
