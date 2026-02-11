import { db } from "../db/supabaseClient.js";
import type { Request, Response } from "express";

export const userService = {
    signUpUser: async (email: string, password: string) => {
        const { data: email_data, error: _ } = await db.users.getByEmail(email);

        if (email_data["id"] != undefined) {
            throw "Email already in use";
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
    // Get all favourites (genres, venues, artists) for a user
    getUserFavourites: async (userId: string) => {
        const { data, error } = await db.users.getByIdWithFavorites(userId);
        if (error) throw error;
        return data;
    },
    // Add favourite genre
    addFavouriteGenre: async (userId: string, genreId: string) => {
        const { data, error } = await db.users.addFavoriteGenre(userId, genreId);
        if (error) throw error;
        return data;
    },
    // Remove favourite genre
    removeFavouriteGenre: async (userId: string, genreId: string) => {
        const { error } = await db.users.removeFavoriteGenre(userId, genreId);
        if (error) throw error;
        return true;
    },
    // Add favourite venue
    addFavouriteVenue: async (userId: string, venueId: string) => {
        const { data, error } = await db.users.addFavoriteVenue(userId, venueId);
        if (error) throw error;
        return data;
    },
    // Remove favourite venue
    removeFavouriteVenue: async (userId: string, venueId: string) => {
        const { error } = await db.users.removeFavoriteVenue(userId, venueId);
        if (error) throw error;
        return true;
    },
    // Add favourite artist
    addFavouriteArtist: async (userId: string, artistId: string) => {
        const { data, error } = await db.users.addFavoriteArtist(userId, artistId);
        if (error) throw error;
        return data;
    },
    // Remove favourite artist
    removeFavouriteArtist: async (userId: string, artistId: string) => {
        const { error } = await db.users.removeFavoriteArtist(userId, artistId);
        if (error) throw error;
        return true;
    },
};
