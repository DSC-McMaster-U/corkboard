import express from "express";
import type { Request, Response } from "express";
import { userService } from "../services/userService.js";
import { authService } from "../services/authService.js";
import { parseIntOr } from "../utils/parser.js";

const router = express.Router();

// // GET /api/users/ - Converts jwt token to user information
// router.get(
//     "/",
//     authService.validateToken,
//     async (req: Request, res: Response) => {
//         const user = authService.getUser(res);

//         // handled unauthorized user
//         if (user == undefined) {
//             res.status(401).json({ error: "Unauthorized" });
//             return;
//         }

//         res.status(200).json({ user: user });
//     },
// );

// POST /api/users/:userId - Updates user information

// PUT /api/users/:userId - Updates user profile
router.put(
    "/:userId",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const authenticatedUser = authService.getUser(res);

        if (authenticatedUser == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // 2. SECURITY CHECK: Ensure URL param matches the logged-in user's ID
        const targetUserId = req.params.userId;

        if (!targetUserId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        if (authenticatedUser.id !== targetUserId) {
            res.status(403).json({
                error: "Forbidden: You can only update your own account.",
            });
            return;
        }

        // 3. Extract fields (undefined fields are handled by your service)
        const { name, username, profile_picture, bio } = req.body;

        // 4. Call your existing service
        try {
            const data = await userService.updateUser(
                targetUserId,
                name,
                username,
                profile_picture,
                bio,
            );

            res.status(200).json({ success: true, user: data });
        } catch (err: any) {
            console.error("Update failed:", err);
            res.status(500).json({
                success: false,
                error: err.message || "Internal Server Error",
            });
        }
    },
);

// POST /api/users/
router.post("/", async (req: Request, res: Response) => {
    let {
        email = undefined,
        password = undefined,
        name = undefined,
        username = undefined,
        profile_picture = undefined,
        bio = undefined,
    } = req.body;

    if (email === "" || email === undefined) {
        res.status(400).json({ error: "Non-empty email is required" });
        return;
    }

    if (password === "" || password === undefined) {
        res.status(400).json({ error: "Non-empty password is required" });
        return;
    }

    userService
        .signUpUser(email, password)
        .then(async (signUpRes) => {
            let signInResult = await userService.signInUser(email, password);

            // Endpoint still succeeds if this step fails, as having null information does not prevent user sign-in
            await userService
                .updateUser(
                    signUpRes.user?.id!,
                    name,
                    username,
                    profile_picture,
                    bio,
                )
                .catch((err) => {
                    console.warn("Error updating user information: ", err);
                });

            res.status(200).json({
                success: true,
                jwt: signInResult.session.access_token,
            });
        })
        .catch((err: Error) => {
            res.status(500).json({ success: false, error: err.message });
        });
});

// GET /api/users/ - Gets user information for the authenticated user, including their favorites
router.get(
    "/",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const authenticatedUser = authService.getUser(res);

        if (authenticatedUser == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        userService
            .getUserByIDWithFavorites(authenticatedUser.id)
            .then((data) => {
                res.status(200).json({ success: true, user: data });
            })
            .catch((err: Error) => {
                res.status(500).json({ success: false, error: err.message });
            });
    },
);

// add favorite genre
// POST /api/users/addGenre - adds genre to user's favorites
router.post(
    "/addGenre",
    authService.validateToken,
    async (req: Request, res: Response) => {
        let user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { genreId = undefined } = req.body;

        if (genreId == undefined || genreId === "") {
            res.status(400).json({ error: "Missing genre ID" });
            return;
        }

        userService
            .addFavoriteGenre(String(user.id), genreId as string)
            .then(() => {
                res.status(200).json({ success: true });
            })
            .catch((err: Error) => {
                res.status(500).json({ error: err.message });
            });
    },
);

// remove favourite genre
// DELETE  /api/users/removeGenre - removes genre from user's favorites
router.delete(
    "/removeGenre",
    authService.validateToken,
    async (req: Request, res: Response) => {
        let user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { genreId = undefined } = req.body;

        if (genreId == undefined || genreId === "") {
            res.status(400).json({ error: "Missing genre ID" });
            return;
        }

        userService
            .removeFavoriteGenre(String(user.id), genreId as string)
            .then(() => {
                res.status(200).json({ success: true });
            })
            .catch((err: Error) => {
                res.status(500).json({ error: err.message });
            });
    },
);

// add favourite venue
// POST /api/users/addVenue - adds venue to user's favorites
router.post(
    "/addVenue",
    authService.validateToken,
    async (req: Request, res: Response) => {
        let user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { venueId = undefined } = req.body;

        if (venueId == undefined || venueId === "") {
            res.status(400).json({ error: "Missing venue ID" });
            return;
        }

        userService
            .addFavoriteVenue(String(user.id), venueId as string)
            .then(() => {
                res.status(200).json({ success: true });
            })
            .catch((err: Error) => {
                res.status(500).json({ error: err.message });
            });
    },
);

// remove favourite venue
// DELETE  /api/users/removeVenue - removes venue from user's favorites
router.delete(
    "/removeVenue",
    authService.validateToken,
    async (req: Request, res: Response) => {
        let user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { venueId = undefined } = req.body;

        if (venueId == undefined || venueId === "") {
            res.status(400).json({ error: "Missing venue ID" });
            return;
        }

        userService
            .removeFavoriteVenue(String(user.id), venueId as string)
            .then(() => {
                res.status(200).json({ success: true });
            })
            .catch((err: Error) => {
                res.status(500).json({ error: err.message });
            });
    },
);

router.get(
    "/suggested-events",
    authService.validateToken,
    async (req: Request, res: Response) => {
        let user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
        }

        const limit = parseIntOr(req.query.limit as string | undefined, 10);

        userService
            .getPersonalizedEventSuggestions(String(user.id), limit)
            .then((events) => {
                res.status(200).json({ success: true, events: events });
            })
            .catch((err: Error) => {
                res.status(500).json({ sucess: false, error: err.message });
            });
    },
);

export default router;
