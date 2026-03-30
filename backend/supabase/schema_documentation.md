# Database Schema Documentation

## Tables

- `venues` - Venue information
- `events` - Event listings with source tracking
- `users` - User accounts
- `genres` - Music genres
- `artists` - Artists/performers
- `user_bookmarks` - User-event bookmarks (many-to-many)
- `event_genres` - Event-genre associations (many-to-many)
- `user_favorite_genres` - User favorite genres (many-to-many)
- `user_favorite_venues` - User favorite venues (many-to-many)
- `user_favorite_artists` - User favorite artists (many-to-many)
- `user_event_drafts` - User-created event drafts before publication

## Enum Types

### `event_status`
- `'draft'` - Event is not yet published
- `'hidden'` - Event is hidden from public view
- `'published'` - Event is visible to users

### `venue_type_enum`
- `'bar'` - Bar/tavern
- `'club'` - Nightclub
- `'theater'` - Theater/concert hall
- `'venue'` - General venue
- `'outdoor'` - Outdoor venue
- `'other'` - Other venue types

### `source_type_enum`
- `'manual'` - Manually entered by team/admin
- `'api'` - From official API (e.g., Eventbrite API, Meetup API)
- `'scraping'` - Web scraping (HTML parsing)
- `'rss'` - RSS feed
- `'ics'` - iCalendar (.ics) file
- `'user'` - Created by a user
- `'other'` - Other methods

### `ingestion_status_enum`
- `'pending'` - Queued for processing
- `'processing'` - Currently being processed
- `'success'` - Successfully ingested
- `'failed'` - Ingestion failed (needs review)

## Events Table - Source Tracking Fields

### `source_type` (enum)
**Purpose:** Indicates how the event data was acquired.

**Default:** `'manual'`

### `source_url` (text)
**Purpose:** URL where the event data originated from.

**Examples:**
- API: `https://api.eventbrite.com/v3/events/12345/`
- Scraping: `https://venue-website.com/events/jan-15-show`
- RSS: `https://venue.com/events.rss`
- ICS: `https://venue.com/calendar.ics`
- Manual: `NULL` (can be left empty)

### `ingestion_status` (enum)
**Purpose:** Tracks the status of the data ingestion process.

**Default:** `'success'`

**See also:** `backend/SOURCE_TRACKING.md` for detailed usage guide

## Events Table - Additional Fields

### `artist_id` (uuid, nullable, FK to `artists.id`)
**Purpose:** Foreign key reference to the artist/performer for the event.

**Relationship:** Links to `artists` table via foreign key constraint.

**Examples:**
- UUID reference to artist record
- `NULL` (for events without a specific artist)

**Note:** The old `artist` VARCHAR column was replaced with `artist_id` in migration 011

### `image` (varchar(255), nullable)
**Purpose:** Stores Supabase Storage URL for event image.

**Format:** Full Supabase Storage public URL (e.g. `"https://<project-id>.supabase.co/storage/v1/object/public/events/event-123.jpg"`)

**Examples:**
- `"https://dniawpahwcqtvcnaaexv.supabase.co/storage/v1/object/public/events/the-casbah.jpg"`
- `"https://dniawpahwcqtvcnaaexv.supabase.co/storage/v1/object/public/events/jazz-night.png"`
- `NULL` (for events without images)

**Note:** Images are stored in Supabase Storage. Migration 015 converted existing relative paths to full Supabase Storage URLs.

### `archived` (boolean, NOT NULL, default: false)
**Purpose:** Indicates whether an event has been archived (typically for past events).

**Default:** `false` (not archived)

**Behavior:**
- Archived events are excluded from `db.events.getAll()` by default
- Use `includeArchived: true` parameter to include archived events
- Past events can be automatically archived using `db.events.archivePastEvents()`

**Examples:**
- `true` - Event is archived (past event, hidden from default listings)
- `false` - Event is active (visible in default listings)

**Index:** `idx_events_archived` for efficient filtering

**Note:** Added in migration 013. Events are not automatically archived; use `archivePastEvents()` method or archive manually.

## Venues Table - Location Fields

### `latitude` (decimal(10, 8), nullable)
**Purpose:** Geographic latitude coordinate for venue location.

**Precision:** 8 decimal places (accurate to ~1.1mm at equator)

**Range:** -90.0 to 90.0 (10 digits total: 2 before decimal, 8 after)

**Example:** `43.2557` (Hamilton, ON)

### `longitude` (decimal(11, 8), nullable)
**Purpose:** Geographic longitude coordinate for venue location.

**Precision:** 8 decimal places (accurate to ~1.1mm at equator)

**Range:** -180.0 to 180.0 (11 digits total: 3 before decimal, 8 after)

**Example:** `-79.8711` (Hamilton, ON)

**Note:** Both fields are nullable to allow venues without coordinates (can be populated later via geocoding).

## Venues Table - Additional Fields

### `description` (varchar(255), nullable)
**Purpose:** Venue description or bio.

**Examples:**
- `"A cozy bar in downtown Hamilton featuring live music every weekend"`
- `NULL` (no description provided)

**Note:** Added in migration 017.

### `link` (varchar(255), nullable)
**Purpose:** Venue website or social media link.

**Examples:**
- `"https://thecasbah.ca"`
- `"https://www.facebook.com/thecasbah"`
- `NULL` (no link provided)

**Note:** Added in migration 017.

### `image` (varchar(255), nullable)
**Purpose:** Supabase Storage URL for venue image.

**Format:** Full Supabase Storage public URL (e.g. `"https://<project-id>.supabase.co/storage/v1/object/public/venues/venue-123.jpg"`)

**Examples:**
- `"https://dniawpahwcqtvcnaaexv.supabase.co/storage/v1/object/public/venues/the-casbah.jpg"`
- `NULL` (no image provided)

**Note:** Added in migration 019.

## Users Table - Account Fields

### `username` (varchar(100), nullable, UNIQUE)
**Purpose:** Unique username for the user account.

**Examples:**
- `"testuser"`
- `"janedoe"`
- `NULL` (optional field)

### `profile_picture` (varchar(255), nullable)
**Purpose:** Supabase Storage URL for user profile picture.

**Format:** Full Supabase Storage public URL (e.g. `"https://<project-id>.supabase.co/storage/v1/object/public/users/testuser.jpg"`)

**Examples:**
- `"https://dniawpahwcqtvcnaaexv.supabase.co/storage/v1/object/public/users/testuser.jpg"`
- `NULL` (no profile picture)

**Note:** Migration 015 converted existing relative paths to full Supabase Storage URLs.

### `bio` (text, nullable)
**Purpose:** User biography/description.

**Examples:**
- `"Student at McMaster University. Love live shows and discovering new artists!"`
- `NULL` (no bio provided)

## Artists Table

**Purpose:** Normalized table for artists/performers. Replaces the VARCHAR `artist` column in events.

### Columns
- `id` (uuid, PRIMARY KEY) - Unique identifier
- `name` (varchar(255), UNIQUE, NOT NULL) - Artist name
- `bio` (text, nullable) - Artist biography
- `image` (varchar(255), nullable) - Supabase Storage URL for artist image (e.g. `"https://<project-id>.supabase.co/storage/v1/object/public/artists/artist-123.jpg"`)
- `created_at` (timestamp) - Creation timestamp

**Relationships:**
- One-to-many with `events` (via `events.artist_id`)
- Many-to-many with `users` (via `user_favorite_artists`)

## User Favorites Tables

### `user_favorite_genres`
**Purpose:** Junction table linking users to their favorite genres.

**Columns:**
- `user_id` (uuid, FK to `users.id`)
- `genre_id` (uuid, FK to `genres.id`)
- `created_at` (timestamp)

**Primary Key:** (`user_id`, `genre_id`)

### `user_favorite_venues`
**Purpose:** Junction table linking users to their favorite venues.

**Columns:**
- `user_id` (uuid, FK to `users.id`)
- `venue_id` (uuid, FK to `venues.id`)
- `created_at` (timestamp)

**Primary Key:** (`user_id`, `venue_id`)

### `user_favorite_artists`
**Purpose:** Junction table linking users to their favorite artists.

**Columns:**
- `user_id` (uuid, FK to `users.id`)
- `artist_id` (uuid, FK to `artists.id`)
- `created_at` (timestamp)

**Primary Key:** (`user_id`, `artist_id`)

## User Event Drafts Table

**Purpose:** Stores event drafts created by users before they are published. This table allows users to save incomplete event information and either reference existing venues/artists or specify new ones to be created.

### Core Fields

- `id` (uuid, PRIMARY KEY) - Unique identifier
- `title` (varchar(255), NOT NULL) - Event title
- `description` (varchar(255), NOT NULL) - Event description
- `start_time` (timestamptz, NOT NULL) - Event start time (timezone-aware)
- `cost` (numeric(10, 2), NOT NULL) - Event cost
- `created_at` (timestamp, default: NOW()) - Draft creation timestamp
- `user_id` (uuid, NOT NULL, FK to `users.id` ON DELETE CASCADE) - User who created the draft

### Optional Fields

- `source_url` (text, nullable) - Source URL for the event
- `image` (varchar(255), nullable) - Event image URL (Supabase Storage)

### Venue Fields (Dual Approach)

**Foreign Key Reference:**
- `venue_id` (uuid, nullable, FK to `venues.id` ON DELETE SET NULL) - Reference to existing venue

**Denormalized Fields (for new venues):**
- `venue_name` (varchar(255), nullable) - Name of new venue to create
- `venue_address` (text, nullable) - Address of new venue
- `venue_type` (venue_type_enum, nullable) - Type of new venue
- `venue_latitude` (numeric(10, 8), nullable) - Latitude coordinate
- `venue_longitude` (numeric(11, 8), nullable) - Longitude coordinate

**Usage:** If `venue_id` is provided, use the existing venue. Otherwise, use the denormalized fields to create a new venue when publishing.

### Artist Fields (Dual Approach)

**Foreign Key Reference:**
- `artist_id` (uuid, nullable, FK to `artists.id` ON DELETE SET NULL) - Reference to existing artist

**Denormalized Fields (for new artists):**
- `artist_name` (varchar(255), nullable) - Name of new artist to create
- `artist_bio` (text, nullable) - Biography of new artist
- `artist_image` (varchar(255), nullable) - Image URL for new artist

**Usage:** If `artist_id` is provided, use the existing artist. Otherwise, use the denormalized fields to create a new artist when publishing.

### Relationships

- Many-to-one with `users` (via `user_id`)
- Optional many-to-one with `venues` (via `venue_id`)
- Optional many-to-one with `artists` (via `artist_id`)

### Indexes

- `idx_user_event_drafts_user_id` - Optimize queries for user's drafts
- `idx_user_event_drafts_venue_id` - Optimize venue lookups
- `idx_user_event_drafts_artist_id` - Optimize artist lookups
- `idx_user_event_drafts_created_at` - Optimize sorting by creation date

**Note:** Created in migration 018.

## Constraints

### `events_start_time_future`
- **Table:** `events`
- **Constraint:** `start_time > created_at`
- **Purpose:** Events must start after creation

### `events_cost_non_negative`
- **Table:** `events`
- **Constraint:** `cost >= 0` OR `cost IS NULL`
- **Purpose:** Cost cannot be negative

### NOT NULL Constraints
- `venues.name` - Venue name is required
- `genres.name` - Genre name is required
- `events.status` - Event status is required

## Indexes

### `idx_events_start_time`
- **Table:** `events`
- **Column:** `start_time`
- **Purpose:** Optimize date-based queries and filtering

### `idx_events_status`
- **Table:** `events`
- **Column:** `status`
- **Purpose:** Optimize filtering by event status

### `idx_events_source_type`
- **Table:** `events`
- **Column:** `source_type`
- **Purpose:** Optimize filtering by data source

### `idx_events_ingestion_status`
- **Table:** `events`
- **Column:** `ingestion_status`
- **Purpose:** Optimize monitoring of ingestion pipeline

### `idx_events_venue_id`
- **Table:** `events`
- **Column:** `venue_id`
- **Purpose:** Optimize venue-event joins

### `idx_user_bookmarks_user_id`
- **Table:** `user_bookmarks`
- **Column:** `user_id`
- **Purpose:** Optimize bookmark queries by user (used by `getByUserId()`, `exists()`, `delete()`)

### `idx_user_bookmarks_created_at`
- **Table:** `user_bookmarks`
- **Column:** `created_at`
- **Purpose:** Optimize sorting bookmarks by creation date (for `getByUserId().oder()`)

### `idx_events_artist_id`
- **Table:** `events`
- **Column:** `artist_id`
- **Purpose:** Optimize artist-event joins and filtering

### `idx_user_favorite_genres_user_id`
- **Table:** `user_favorite_genres`
- **Column:** `user_id`
- **Purpose:** Optimize queries for user's favorite genres

### `idx_user_favorite_venues_user_id`
- **Table:** `user_favorite_venues`
- **Column:** `user_id`
- **Purpose:** Optimize queries for user's favorite venues

### `idx_user_favorite_artists_user_id`
- **Table:** `user_favorite_artists`
- **Column:** `user_id`
- **Purpose:** Optimize queries for user's favorite artists

### `idx_user_favorite_artists_artist_id`
- **Table:** `user_favorite_artists`
- **Column:** `artist_id`
- **Purpose:** Optimize reverse lookups (find users who like an artist)

### `idx_artists_name`
- **Table:** `artists`
- **Column:** `name`
- **Purpose:** Optimize artist lookups by name

### `idx_user_event_drafts_user_id`
- **Table:** `user_event_drafts`
- **Column:** `user_id`
- **Purpose:** Optimize queries for user's drafts

### `idx_user_event_drafts_venue_id`
- **Table:** `user_event_drafts`
- **Column:** `venue_id`
- **Purpose:** Optimize venue lookups in drafts

### `idx_user_event_drafts_artist_id`
- **Table:** `user_event_drafts`
- **Column:** `artist_id`
- **Purpose:** Optimize artist lookups in drafts

### `idx_user_event_drafts_created_at`
- **Table:** `user_event_drafts`
- **Column:** `created_at`
- **Purpose:** Optimize sorting drafts by creation date

## Sample Data

- 7 venues (4 initial + 3 new from real events)
- 6 events (3 initial + 3 real events from Eventbrite, all in Hamilton)
- 7 genres
- Multiple artists (from events and mock data for testing)
- 2 users with complete profiles and favorites (Test User, Jane Doe)

## Migrations

All schema changes are tracked in `supabase/migrations/`:

- `001_initial_schema.sql` - Initial tables and sample data
- `002_add_enums_constraints_source_tracking.sql` - Enums, constraints, source tracking
- `003_add_sample_users_bookmarks.sql` - Sample user and bookmark data
- `004_upate_time_stamp.sql` - Change `start_time` from `TIMESTAMP` to `TIMESTAMPTZ`
- `005_add_artist_column_and_event_genres.sql` - Add `artist` column to events, populate event_genres
- `006_add_image_and_coordinates.sql` - Add `image` column to events, add `latitude`/`longitude` to venues
- `007_fix_longitude_precision_and_add_venue_coordinates.sql` - Fix longitude precision to DECIMAL(11, 8), add sample venue coordinates
- `008_add_sample_events_for_showcase.sql` - Add 3 real events from Eventbrite (CLUBMATTIX, LOUD LOVE, Therapy - November) with new venues
- `009_add_user_bookmarks_indexes.sql` - Add indexes on `user_bookmarks.user_id` and `user_bookmarks.created_at` for query performance
- `010_add_user_account_fields.sql` - Add `username`, `profile_picture`, `bio` to users; create `artists` table and user favorites junction tables
- `011_add_artist_id_to_events.sql` - Replace `artist` VARCHAR column with `artist_id` FK to `artists` table for normalization
- `012_add_user_account_sample_data.sql` - Add sample user profiles and favorites for testing
- `013_add_archived_column_to_events.sql` - Add `archived` boolean column to events table for handling past events
- `014_add_auth_trigger.sql` - Add trigger to automatically create user record in `users` table when auth user is created
- `015_convert_image_paths_to_supabase_urls.sql` - Convert relative image paths to full Supabase Storage URLs in `events.image`, `artists.image`, and `users.profile_picture`
- `016_add_user_to_source_type_enum.sql` - Add `'user'` value to `source_type_enum` for user-created events
- `017_add_description_and_link_to_venues.sql` - Add `description` and `link` columns to venues table
- `018_create_user_event_drafts_table.sql` - Create `user_event_drafts` table for storing user-created event drafts
- `019_add_image_to_venues.sql` - Add `image` column to venues table for Supabase Storage URLs

**To apply a migration:**
1. Review migration file
2. Copy SQL to Supabase Dashboard → SQL Editor
3. Run and verify
4. Update this documentation if schema changes

