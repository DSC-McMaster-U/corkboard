import { db } from "../db/supabaseClient.js";
import type { Request, Response } from "express";

export const userService = {
    signUpUser: async (email: string, password: string) => {
        const { data: email_data, error: _ } = await db.users.getByEmail(email);

        if (email_data != undefined) {
            throw { message: "Email already in use" };
        }

        const { data, error } = await db.auth.signUp(email, password);

        if (error) throw error;
        return data;
    },
    signInUser: async (email: string, password: string) => {
        const { data, error } = await db.auth.signIn(email, password);

        if (error) throw error;

        return data;
    },
    updateUser: async (
        id: string,
        name: string | undefined,
        username: string | undefined,
        profile_picture: string | undefined,
        bio: string | undefined,
    ) => {
        const { data, error } = await db.users.updateUser(
            id,
            name,
            username,
            profile_picture,
            bio,
        );

        if (error) throw error;

        return data;
    },
    getUserById: async (userId: string) => {
        const { data, error } = await db.users.getById(userId);
        if (error) throw error;
        return data;
    },
    getUserByIDWithFavorites: async (userId: string) => {
        const { data, error } = await db.users.getByIdWithFavorites(userId);
        if (error) throw error;
        return data;
    }
};
