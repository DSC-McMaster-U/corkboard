import express from "express";
import type { Request, Response } from "express";
import { userService } from "../services/userService.js";

const router = express.Router();

router.post("/login", (req: Request, res: Response) => {
    const { email = undefined, password = undefined } = req.body;

    if (email === "" || email === undefined) {
        res.status(400).json({ error: "Non-empty email is required" });
        return;
    }

    if (password === "" || password === undefined) {
        res.status(400).json({ error: "Non-empty password is required" });
        return;
    }

    userService
        .signInUser(email, password)
        .then((result) => {
            res.status(200).json({
                jwt: result.session.access_token,
                success: true,
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: err.message,
                success: false,
            });
        });
});

export default router;
