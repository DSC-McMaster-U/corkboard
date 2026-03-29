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
    publishDraft: async (draftId: string) => {
        // 1. Fetch the draft
        const { data: draft, error: draftError } = await db.userEventDrafts.getById(draftId);
        if (draftError) throw draftError;
        if (!draft) throw new Error("Draft not found");

        // 2. Validate start_time is in the future (events table enforces this via check constraint)
        if (!draft.start_time || new Date(draft.start_time).getTime() <= Date.now()) {
            throw new Error("Cannot publish: start time must be in the future. Edit the draft's start time before publishing.");
        }
        let venue_id: string;
        if (draft.venue_id) {
            // Draft already references an existing venue
            venue_id = draft.venue_id;
        } else {
            // Create a new venue from draft-provided details
            if (!draft.venue_name) throw new Error("Draft has no venue_id and no venue_name to create a venue from");
            const { data: newVenue, error: venueError } = await db.venues.create({
                name: draft.venue_name,
                address: draft.venue_address ?? undefined,
                venue_type: draft.venue_type ?? undefined,
                latitude: draft.venue_latitude ?? undefined,
                longitude: draft.venue_longitude ?? undefined,
                description: undefined,
                link: undefined,
            });
            if (venueError) throw venueError;
            if (!newVenue) throw new Error("Failed to create venue");
            venue_id = newVenue.id;
        }

        // 3. Resolve artist_id
        let artist_id: string | undefined = undefined;
        if (draft.artist_id) {
            // Draft already references an existing artist
            artist_id = draft.artist_id;
        } else if (draft.artist_name) {
            // Create a new artist from draft-provided details
            const { data: newArtist, error: artistError } = await db.artists.create({
                name: draft.artist_name,
                bio: draft.artist_bio ?? undefined,
                image: draft.artist_image ?? undefined,
            });
            if (artistError) throw artistError;
            if (!newArtist) throw new Error("Failed to create artist");
            artist_id = newArtist.id;
        }

        // 4. Create the event
        const { data: event, error: eventError } = await db.events.create({
            title: draft.title,
            description: draft.description,
            venue_id,
            start_time: draft.start_time,
            cost: draft.cost ?? undefined,
            status: "published",
            source_type: "user",
            source_url: draft.source_url ?? undefined,
            image: draft.image ?? undefined,
            artist_id: artist_id ?? undefined,
            submitted_by: draft.user_id,
        });
        if (eventError) throw eventError;
        if (!event) throw new Error("Failed to create event");

        // 5. Delete the draft
        const { error: deleteError } = await db.userEventDrafts.deleteById(draftId);
        if (deleteError) throw deleteError;

        return event;
    },
};