-- Migration 017
-- Date: March 7, 2026
-- Purpose: Add description and link fields to venues table
-- Applied by: Billy
-- Status: Applied

-- Add description column to venues table
ALTER TABLE venues
    ADD COLUMN description VARCHAR(255) NULL;

-- Add link column to venues table
-- Stores venue website/social media link (nullable)
ALTER TABLE venues
    ADD COLUMN link VARCHAR(255) NULL;
