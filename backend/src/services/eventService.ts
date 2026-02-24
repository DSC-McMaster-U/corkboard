import { db } from "../db/supabaseClient.js";

export const eventService = {
    getAllEvents: async (
        limit: number,
        min_start_time: string,
        max_start_time: string,
        min_cost: number,
        max_cost: number,
        includeArchived: boolean = false
    ) => {
        const { data, error } = await db.events.getAll(
            limit,
            min_start_time,
            max_start_time,
            min_cost,
            max_cost,
            includeArchived
        );
        if (error) throw error;
        return data ?? [];
    },

    addEvent: async (
        title: string,
        venue_id: string,
        start_time: string,

        description?: string | null,
        cost?: number | null,
        status?: "published" | "draft" | "hidden",
        source_type?: "manual" | string | null,
        source_url?: string | null,
        ingestion_status?: "success" | "failed" | "pending",
        artist?: string | null,
        image?: string | null
    ) => {
        const { data, error } = await db.events.add(
            title,
            venue_id,
            start_time,
            description,
            cost,
            status,
            source_type,
            source_url,
            ingestion_status,
            artist,
            image
        );
        if (error) throw error;
        return data ?? [];
    },
    
    createEvent: async (
        title: string,
        venue_id: string,
        start_time: string,
        description?: string,
        cost?: number,
        status?: string,
        source_type?: string,
        source_url?: string,
        image?: string,
        artist_id?: string
    ) => {
        const { data, error } = await db.events.create({
            title: title,
            description: description,
            venue_id: venue_id,
            start_time: start_time,
            cost: cost,
            status: status,
            source_type: source_type,
            source_url: source_url,
            image: image,
            artist_id: artist_id,
        });

        if (error) throw error;
        return data;
    },
    archiveEvent: async (eventId: string) => {
        const { data, error } = await db.events.archiveById(eventId);
        if (error) throw error;
        return data;
    },
    unarchiveEvent: async (eventId: string) => {
        const { data, error } = await db.events.unarchiveById(eventId);
        if (error) throw error;
        return data;
    },
    archivePastEvents: async () => {
        const { data, error } = await db.events.archivePastEvents();
        if (error) throw error;
        return data;
    },
    getEventsForVenueInRange: async (
        venue_id: string,
        min_start_time: string,
        max_start_time: string
    ) => {
        const { data, error } = await db.events.getByVenueTimeTitle(
            venue_id,
            min_start_time,
            max_start_time
        );
        if (error) throw error;
        return data ?? [];
    },
    updateEventByID: async (
        id: string,
        patch: {
            title?: string;
            venue_id?: string;
            start_time?: string;
            description?: string | null;
            cost?: number | null;
            status?: "published" | "draft" | "hidden";
            source_type?: "manual" | string | null;
            source_url?: string | null;
            ingestion_status?: "success" | "failed" | "pending";
            artist_id?: string | null;
            image?: string | null;
        }
    ) => {
        const {data, error} = await db.events.updateByID(id, patch);
        if (error) throw error;
        return data;
    },
    deleteEventsForVenue: async (
        venueId: string
    ) => {
        const { data, error } = await db.events.deleteForVenue(venueId);
        if (error) throw error;
        return data;
    },
    deleteEventByID: async (
        id: string
    ) => {
        const { data, error } = await db.events.deleteById(id);
        if (error) throw error;
        return data;
    },

    // user uploaded event functions below
    getUserUploadedEvents: async (
        limit: number,
        min_start_time: string,
        max_start_time: string,
        min_cost: number,
        max_cost: number,
    ) => {
        const { data, error } = await db.events.getUserUploadedDrafts(
            limit,
            min_start_time,
            max_start_time,
            min_cost,
            max_cost,
        );
        if (error) throw error;
        return data ?? [];
    },
    uploadUserEvent: async (
        user_id: string,
        title: string,
        venue_id: string,
        start_time: string,
        description: string,
        cost?: number,
        image?: string,
        artist_id?: string,
    ) => {
        const { data, error } = await db.events.create({
            title: title,
            description: description,
            venue_id: venue_id,
            start_time: start_time,
            cost: cost,
            status: "draft",
            source_type: "manual", // update this after db migration
            source_url: user_id,
            image: image,
            artist_id: artist_id,
        });

        if (error) throw error;
        return data;
    },
};
