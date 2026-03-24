import express from "express";
import type { Request, Response } from "express";
import { bookmarkService } from "../services/bookmarkService.js";
import { authService } from "../services/authService.js";

const router = express.Router();

// GET /api/bookmarks/ - Returns all of the bookmarks for a given user
router.get(
    "/",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        bookmarkService
            .getBookmarks(String(user.id))
            .then((result) => {
                res.status(200).json({ bookmarks: result });
            })
            .catch((err) => {
                res.status(500).json({ error: err });
            });
    }
);

// POST /api/bookmarks/ - Adds a bookmark for a given event to a given user
router.post(
    "/",
    authService.validateToken,
    async (req: Request, res: Response) => {
        let user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { eventId = undefined } = req.body;

        if (eventId == undefined || eventId === "") {
            res.status(400).json({ error: "Missing event ID" });
            return;
        }

        bookmarkService
            .addBookmark(String(user.id), eventId as string)
            .then(() => {
                res.status(200).json({ success: true });
            })
            .catch((err) => {
                console.log("Create bookmark error:", err)
                res.status(500).json({ error: err });
            });
    }
);

// DELETE /api/bookmarks/ - Removes a bookmark for a given event from a given user
router.delete(
    "/",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { eventId = undefined } = req.body;

        if (eventId == undefined) {
            res.status(400).json({ error: "Missing event ID" });
            return;
        }

        console.log('DELETE bookmark - user:', user.id, 'eventId:', eventId, 'eventId type:', typeof eventId);

        bookmarkService
            .removeBookmark(String(user.id), eventId as string)
            .then(() => {
                res.status(200).json({ success: true });
            })
            .catch((err) => {
                // Return 204 for not found
                if (err == new Error("Bookmark not found")) {
                    res.status(204).json({ success: true });
                    return
                }

                console.error('Error removing bookmark:', err);
                res.status(500).json({ error: err });
            });
    }
);

export default router;
