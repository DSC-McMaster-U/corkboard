import express from "express";
import type { Request, Response } from "express";
import { venueService } from "../services/venueService.js";
import { parseIntOr } from "../utils/parser.js";

const router = express.Router();
const DEFAULT_VENUE_LIMIT = 10;

// GET /api/venues - Get venues matching an id, up to a certain limit
router.get("/", async (req: Request, res: Response) => {
    try {
        const { id = undefined, limit = undefined } = req.query;

        if (id != undefined) {
            const venue = await venueService.getVenueById(id as string);
            res.json({ venue: venue });
            return;
        }

        const limitNum = parseIntOr(limit as string, DEFAULT_VENUE_LIMIT);
        const venues = await venueService.getAllVenues(limitNum);

        res.json({ venues: venues, count: venues.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/venues - Create a venue
router.post("/", async (req: Request, res: Response) => {
    // Handle Input
    const {
        name = undefined,
        venue_type = undefined,
        address = undefined,
        latitude = undefined,
        longitude = undefined,
        description = undefined,
        link = undefined,
        image = undefined,
    } = req.body;

    if (name == undefined) {
        res.status(400).json({ error: "Name is missing" });
        return;
    }

    // Call Service
    venueService
        .createVenue(name, venue_type, address, latitude, longitude, description, link, image)
        .then((venue) => {
            res.status(200).json({ id: venue["id"], success: true });
        })
        .catch((err: Error) => {
            console.log("Error creating venue: ", err);
            res.status(500).json({ success: false, error: err });
        });
});

// Add more venue routes here (POST, PUT, DELETE, etc.)

export default router;
