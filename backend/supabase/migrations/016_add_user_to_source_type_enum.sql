-- Migration 016
-- Purpose: Add 'user' to source_type_enum for events created by users
-- Applied by: Billy

ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'user';
