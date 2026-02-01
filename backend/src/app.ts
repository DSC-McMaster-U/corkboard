/**
 * This is the main entrypoint for the backend
 */

import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import eventRoutes from "./routes/events.js";
import venueRoutes from "./routes/venues.js";
import healthRoutes from "./routes/health.js";
import userRoutes from "./routes/users.js";
import bookmarkRoutes from "./routes/bookmarks.js";
import genreRoutes from "./routes/genres.js";
import imageRoutes from "./routes/images.js";
import authRoutes from "./routes/auth.js";

// Cursed way to get dir name to work with both TS and babel (jest)
import __dirname from "./meta.cjs";

// Load environment variables
//dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get directory paths
//const __filename = fileURLToPath(import.meta.url); // get the filename of the current module
//const __dirname = path.dirname(__filename); // get the directory name of the current module

// Middleware
if (!process.env.TEST_ENV) {
    app.use(cors());
}

app.use(express.json());

// Images can be accessed via: http://localhost:3000/images/events/event-123.jpg
app.use(
    express.static(path.join(path.normalize(__dirname as string), "../public")),
); // backend/public/

// Main page
app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Welcome to the Corkboard API",
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/users/", userRoutes);
app.use("/api/bookmarks/", bookmarkRoutes);
app.use("/api/genres", genreRoutes);
app.use("/api/images", imageRoutes);

if (!process.env.TEST_ENV) {
    app.listen(PORT, () => {
        console.log(`Corkboard API running on port ${PORT}`);
        console.log(`Auth: http://localhost:${PORT}/api/auth`);
        console.log(`Health: http://localhost:${PORT}/api/health`);
        console.log(`Events: http://localhost:${PORT}/api/events`);
        console.log(`Venues: http://localhost:${PORT}/api/venues`);
        console.log(`Users: http://localhost:${PORT}/api/users`);
        console.log(`Bookmarks: http://localhost:${PORT}/api/bookmarks`);
        console.log(`Genres: http://localhost:${PORT}/api/genres`);
        console.log(`Images: http://localhost:${PORT}/api/images`);
    });
}

// Export to link with tests
export default app;
