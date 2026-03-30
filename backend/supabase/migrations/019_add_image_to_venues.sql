-- Migration 019
-- Date: March 7, 2026
-- Purpose: Add image field to venues table
-- Applied by: Billy
-- Status: Pending

-- Add image column to venues table
-- Stores Supabase Storage URL for venue image (nullable)
ALTER TABLE venues
    ADD COLUMN image VARCHAR(255) NULL;
