import { db } from "../db/supabaseClient.js";

export const draftService = {
    getAllDrafts: async (
        limit: number,
        min_start_time: string,
        max_start_time: string,
        min_cost: number,
        max_cost: number,
        userId?: string
    ) => {
        const { data, error } = await db.userEventDrafts.getAll(
            limit,
            min_start_time,
            max_start_time,
            min_cost,
            max_cost,
            userId
        );
        if (error) throw error;
        return data ?? [];
    },

    uploadDraft: async (
        title: string,
        description: string,
        start_time: string,
        cost: number,
        user_id: string,
        source_url: string | null,
        image: string | null,
        venue_id: string | null,
        venue_name: string | null,
        venue_address: string | null,
        venue_type: string | null,
        venue_latitude: number | null,
        venue_longitude: number | null,
        artist_id: string | null,
        artist_name: string | null,
        artist_bio: string | null,
        artist_image: string | null
    ) => {
        const { data, error } = await db.userEventDrafts.create({
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
        });
        if (error) throw error;
        return data;
    },

    updateDraftByID: async (
        draftId: string,
        patch: {
            title?: string;
            description?: string;
            start_time?: string;
            cost?: number;
            source_url?: string;
            image?: string;
            venue_id?: string;
            venue_name?: string;
            venue_address?: string;
            venue_type?: string;
            venue_latitude?: number;
            venue_longitude?: number;
            artist_id?: string;
            artist_name?: string;
            artist_bio?: string;
            artist_image?: string;
        }
    ) => {
        const { data, error } = await db.userEventDrafts.updateById(
            draftId,
            patch
        );
        if (error) throw error;
        return data;
    },

    deleteDraftByID: async (draftId: string) => {
        const { data, error } = await db.userEventDrafts.deleteById(draftId);
        if (error) throw error;
        return data;
    },

    getDraftByID: async (draftId: string) => {
        const { data, error } = await db.userEventDrafts.getById(draftId);
        if (error) throw error;
        return data;
    },

    // publish draft: create event from draft, + venue and artist if they don't already exist, then delete draft
};