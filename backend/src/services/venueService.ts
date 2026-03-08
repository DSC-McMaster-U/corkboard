import { db } from "../db/supabaseClient.js";

export const venueService = {
    getAllVenues: async (limit = 10) => {
        const { data, error } = await db.venues.getAll(limit);
        if (error) throw error;
        return data || [];
    },
    getVenueById: async (venueId : string) => {
        const { data, error } = await db.venues.getById(venueId);
        if (error) throw error;
        return data || [];
    },
    createVenue: async (
        name: string,
        venue_type?: string,
        address?: string,
        latitude?: number,
        longitude?: number,
        description?: string,
        link?: string
    ) => {
        const { data, error } = await db.venues.create({
            name: name,
            venue_type: venue_type,
            address: address,
            latitude: latitude,
            longitude: longitude,
            description: description,
            link: link,
        });

        if (error) throw error;
        return data ?? [];
    },
    // Add more venue service methods here
};
