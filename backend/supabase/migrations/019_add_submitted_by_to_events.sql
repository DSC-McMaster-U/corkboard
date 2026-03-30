-- Add submitted_by to track which user submitted an event
-- NULL for scraped/manual events; set to the submitting user's ID for user-submitted events
ALTER TABLE events
    ADD COLUMN submitted_by UUID REFERENCES users(id) ON DELETE SET NULL;
