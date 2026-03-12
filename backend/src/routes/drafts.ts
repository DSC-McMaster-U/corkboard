import express from "express";
import type { Request, Response } from "express";
import { parseDateOr, parseFloatOr, parseIntOr } from "../utils/parser.js";
import { draftService } from "../services/draftService.js";

const router = express.Router();

// GET /api/drafts/ - Get all drafts matching given parameters
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

    const userId = req.query.userId as string | undefined;

    draftService
        .getAllDrafts(
            limit,
            min_start_time.toISOString(),
            max_start_time.toISOString(),
            min_cost,
            max_cost,
            userId,
        )
        .then((drafts) => {
            res.status(200).json({ drafts: drafts, count: drafts.length });
        })
        .catch((err: Error) => {
            console.log("Error getting drafts: ", err);
            res.status(500).json({ error: err });
        });
});

// POST /api/drafts/upload
router.post("/upload", async (req: Request, res: Response) => {
    req.body = req.body ?? {};

    const {
        title,
        description,
        start_time,
        cost,
        user_id,
        source_url,
        image,
        venue_id,
        venue_name,
        venue_address,
        venue_type,
        venue_latitude,
        venue_longitude,
        artist_id,
        artist_name,
        artist_bio,
        artist_image
    } = req.body;

    if  (title == undefined || title === "") {
        res.status(400).json({ error: "Title is missing" });
        return;
    }
    
    if (description == undefined || description === "") {
        res.status(400).json({ error: "Description is missing" });
        return;
    }

    if (start_time == undefined || start_time === "") {
        res.status(400).json({ error: "Start time is missing" });
        return;
    }

    if (cost == undefined || cost === "") {
        res.status(400).json({ error: "Cost is missing" });
        return;
    }

    if (user_id == undefined || user_id === "") {
        res.status(400).json({ error: "User ID is missing" });
        return;
    }

    let parsed_date = parseDateOr(start_time, new Date("1970-01-01"));

    // Current or previous dates are invalid
    if (parsed_date.getTime() <= new Date().getTime()) {
        res.status(400).json({ error: "Invalid start time" });
        return;
    }

    draftService
        .uploadDraft(
            title,
            description,
            parsed_date.toISOString(),
            cost,
            user_id,
            source_url,
            image,
            venue_id,
            venue_name,
            venue_address,
            venue_type,
            venue_latitude,
            venue_longitude,
            artist_id,
            artist_name,
            artist_bio,
            artist_image
        )
        .then((result) => {
            res.status(200).json({ id: result.id, success: true });
        })
        .catch((err) => {
            res.status(500).json({ success: false, error: err });
        });
});

// GET /api/drafts/:id - Get draft by ID
router.get("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ error: "Draft ID is missing" });
        return;
    }

    draftService
        .getDraftByID(id)
        .then((draft) => {
            res.status(200).json({ draft });
        })
        .catch((err) => {
            res.status(404).json({ error: "Draft not found" });
        });
});

// DELETE /api/drafts/:id - Delete draft by ID
router.delete("/:id", async (req: Request, res: Response) => {
    const id = req.body.id as string | undefined;
    
    if (id == undefined || id === "") {
        res.status(400).json({ error: "Draft ID is missing" });
        return;
    }

    draftService.deleteDraftByID(id)
        .then(() => {
            res.status(200).json({ success: true });
        })
        .catch((err) => {
            res.status(500).json({ success: false, error: err });
        });
});

// POST /api/drafts/updateDraft - Update draft by ID
router.post("/updateDraft", async (req: Request, res: Response) => {
    req.body = req.body ?? {};

    const {
        id = undefined,
        title = undefined,
        description = undefined,
        start_time = undefined,
        source_url = undefined,
        image = undefined,
        venue_id = undefined,
        venue_name = undefined,
        venue_address = undefined,
        venue_type = undefined,
        venue_latitude = undefined,
        venue_longitude = undefined,
        artist_id = undefined,
        artist_name = undefined,
        artist_bio = undefined,
        artist_image = undefined
    } = req.body;

    const cost = parseFloatOr(req.body.cost, 0);

    if (id == undefined || id === "") {
        res.status(400).json({ error: "Draft ID is missing" });
        return;
    }

    draftService.updateDraftByID(id, {
        title,
        description,
        start_time,
        cost,
        source_url,
        image,
        venue_id,
        venue_name,
        venue_address,
        venue_type,
        venue_latitude,
        venue_longitude,
        artist_id,
        artist_name,
        artist_bio,
        artist_image
    })
        .then((result) => {
            res.status(200).json({ id: result.id, success: true });
        })
        .catch((err) => {
            console.error("Error updating draft:", err);
            res.status(500).json({ success: false, error: err?.message ?? String(err) });
        });
});


// POST /api/drafts/publish/:id - Publish draft by ID (create event from draft, + venue and artist if they don't already exist, then delete draft)
router.post("/publish/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ error: "Draft ID is missing" });
        return;
    }

    draftService
        .publishDraft(id)
        .then((event) => {
            res.status(200).json({ event, success: true });
        })
        .catch((err: Error) => {
            console.log("Error publishing draft: ", err);
            res.status(500).json({ success: false, error: err.message ?? err });
        });
});

export default router;