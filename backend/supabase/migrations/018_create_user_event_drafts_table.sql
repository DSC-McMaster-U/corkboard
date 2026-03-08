-- Migration 018
-- Date: March 7, 2026
-- Purpose: Create user_event_drafts table for storing user-created event drafts
-- Applied by: Billy
-- Status: Pending

-- Create user_event_drafts table
CREATE TABLE user_event_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    source_url TEXT,
    image VARCHAR(255),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_type venue_type_enum,
    venue_latitude NUMERIC(10, 8),
    venue_longitude NUMERIC(11, 8),
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    artist_name VARCHAR(255),
    artist_bio TEXT,
    artist_image VARCHAR(255)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_event_drafts_user_id ON user_event_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_drafts_venue_id ON user_event_drafts(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_event_drafts_artist_id ON user_event_drafts(artist_id);
CREATE INDEX IF NOT EXISTS idx_user_event_drafts_created_at ON user_event_drafts(created_at);
