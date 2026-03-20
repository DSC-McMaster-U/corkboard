import { NODE_ENV } from "../app.js";
import { db } from "../db/supabaseClient.js";
import type { Request, Response } from "express";

// Deterministic test user for non-hermetic tests
// Note: JWT tests use a separate user (test_auth@example.com) for auth flow testing (instead of TESTING_BYPASS)
const BYPASS_USER_ID = "c51a653f-0b60-44cf-b160-68c0554dea6c"; // "name"="Test User"

export const authService = {
    validateToken: async (req: Request, res: Response, next: () => any) => {
        const authHeader = req.header("Authorization");

        // handle testing bypass (for non-hermetic tests)
        if (authHeader === "TESTING_BYPASS" && NODE_ENV != "production") {
            const { data: user, error } =
                await db.users.getById(BYPASS_USER_ID);
            if (error || !user) {
                authService.setUser(res, undefined);
            } else {
                authService.setUser(res, {
                    name: user.name || "Test User",
                    id: user.id, // UUID string
                });
            }
            next();
            return;
        }

        // validate JWT token
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            authService.setUser(res, undefined);
            next();
            return;
        }

        const token = authHeader.replace("Bearer ", "");

        try {
            // try to verify JWT token with Supabase

            const {
                data: { user: authUser },
                error: authError,
            } = await db.auth.validateJWT(token);

            if (authError || !authUser) {
                authService.setUser(res, undefined);
                next();
                return;
            }

            // get user from database using Supabase auth user ID
            const { data: dbUser, error: dbError } = await db.users.getById(
                authUser.id,
            );

            if (dbError || !dbUser) {
                // auth user exists but not in our database (users table)
                authService.setUser(res, undefined);
                next();
                return;
            }

            // set authenticated user
            authService.setUser(res, {
                name: dbUser.name || authUser.email || "Test JWT_Auth",
                id: dbUser.id,
                email: dbUser.email,
            });
        } catch (error) {
            authService.setUser(res, undefined);
        }

        next();
    },
    refreshToken: async (token: string) => {
        throw new Error("authService.refreshToken is unimplemented");
    },
    authenticateUser: async () => {},
    setUser: (res: Response, user: any) => {
        res.locals.user = user;
    },
    getUser: (res: Response) => {
        return res.locals.user;
    },
};
