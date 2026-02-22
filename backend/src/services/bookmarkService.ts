import { db } from "../db/supabaseClient.js";

export const bookmarkService = {
    getBookmarks: async (userId: string) => { // note: UUID use string
        const { data, error } = await db.bookmarks.getByUserId(userId);
        if (error) throw error;
        return data || [];
    },
    addBookmark: async (userId: string, eventId: string) => {
        const { data: event, error: eventError } = await db.events.getById(eventId);
        if (eventError || !event) {
            throw new Error("Event not found");
        }

        // check if already bookmarked - if so, return success (idempotent)
        const { data: existing } = await db.bookmarks.exists(userId, eventId);
        if (existing) {
            return existing; // Already bookmarked, return existing record
        }

        const { data, error } = await db.bookmarks.create(userId, eventId);
        if (error) throw error;
        return data;
    },
    removeBookmark: async (userId: string, eventId: string) => {
        // Convert eventId to string to handle numeric IDs from frontend
        const eventIdStr = String(eventId);
        
        console.log('removeBookmark - userId:', userId, 'eventId:', eventId, 'eventIdStr:', eventIdStr);
        
        // check if bookmark exists
        const { data: existing, error: existsError } = await db.bookmarks.exists(userId, eventIdStr);
        console.log('exists result - data:', existing, 'error:', existsError);
        
        if (!existing) {
            throw new Error("Bookmark not found");
        }

        const { error } = await db.bookmarks.delete(userId, eventIdStr);
        if (error) {
            console.error('delete error:', error);
            throw error;
        }
        return true;
    },
};
