import express from "express";
import type { Request, Response } from "express";
import { userService } from "../services/userService.js";
import { authService } from "../services/authService.js";

const router = express.Router();

// GET /api/users/ - Converts jwt token to user information
router.get(
    "/",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        // handled unauthorized user
        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        res.status(200).json({ user: user });
    },
);


// POST /api/users/:userId - Updates user information

// PUT /api/users/:userId - Updates user profile
router.put( "/:userId", authService.validateToken, async (req: Request, res: Response) => {
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
      res.status(403).json({ error: "Forbidden: You can only update your own account." });
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
        bio
      );
      
      res.status(200).json({ success: true, user: data });
    } catch (err: any) {
      console.error("Update failed:", err);
      res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
    }
  }
);


// GET /api/users/favourites - Get all favourites for authenticated user
router.get(
    "/favourites/all",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        try {
            const favourites = await userService.getUserFavourites(String(user.id));
            res.status(200).json({ favourites });
        } catch (err: any) {
            console.error("Failed to get favourites:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }
);

// POST /api/users/favourites/genres - Add favourite genre
router.post(
    "/favourites/genres",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { genreId = undefined } = req.body;

        if (genreId == undefined || genreId === "") {
            res.status(400).json({ error: "Missing genre ID" });
            return;
        }

        try {
            await userService.addFavouriteGenre(String(user.id), genreId);
            res.status(200).json({ success: true });
        } catch (err: any) {
            console.error("Failed to add favourite genre:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }
);

// DELETE /api/users/favourites/genres - Remove favourite genre
router.delete(
    "/favourites/genres",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { genreId = undefined } = req.body;

        if (genreId == undefined || genreId === "") {
            res.status(400).json({ error: "Missing genre ID" });
            return;
        }

        try {
            await userService.removeFavouriteGenre(String(user.id), genreId);
            res.status(200).json({ success: true });
        } catch (err: any) {
            console.error("Failed to remove favourite genre:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }
);

// POST /api/users/favourites/venues - Add favourite venue
router.post(
    "/favourites/venues",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { venueId = undefined } = req.body;

        if (venueId == undefined || venueId === "") {
            res.status(400).json({ error: "Missing venue ID" });
            return;
        }

        try {
            await userService.addFavouriteVenue(String(user.id), venueId);
            res.status(200).json({ success: true });
        } catch (err: any) {
            console.error("Failed to add favourite venue:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }
);

// DELETE /api/users/favourites/venues - Remove favourite venue
router.delete(
    "/favourites/venues",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { venueId = undefined } = req.body;

        if (venueId == undefined || venueId === "") {
            res.status(400).json({ error: "Missing venue ID" });
            return;
        }

        try {
            await userService.removeFavouriteVenue(String(user.id), venueId);
            res.status(200).json({ success: true });
        } catch (err: any) {
            console.error("Failed to remove favourite venue:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }
);

// POST /api/users/favourites/artists - Add favourite artist
router.post(
    "/favourites/artists",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { artistId = undefined } = req.body;

        if (artistId == undefined || artistId === "") {
            res.status(400).json({ error: "Missing artist ID" });
            return;
        }

        try {
            await userService.addFavouriteArtist(String(user.id), artistId);
            res.status(200).json({ success: true });
        } catch (err: any) {
            console.error("Failed to add favourite artist:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }
);

// DELETE /api/users/favourites/artists - Remove favourite artist
router.delete(
    "/favourites/artists",
    authService.validateToken,
    async (req: Request, res: Response) => {
        const user = authService.getUser(res);

        if (user == undefined) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { artistId = undefined } = req.body;

        if (artistId == undefined || artistId === "") {
            res.status(400).json({ error: "Missing artist ID" });
            return;
        }

        try {
            await userService.removeFavouriteArtist(String(user.id), artistId);
            res.status(200).json({ success: true });
        } catch (err: any) {
            console.error("Failed to remove favourite artist:", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
        }
    }
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

export default router;
