# Corkboard API Docs

This document provides the input and output specification for all of Corkboard's Backend Endpoints.

### Important Notes

- All dates should be passed as a string, converted using the method .toISOString()
- Authentication is required for endpoints marked with 🔐 (passes JWT token via Authorization header)
- Image buckets are limited to: `events`, `artists`, `users`
- TODO: Add definition for special enum types (ex: Event Source Enum, Source Type Enum) based on database specifications

---

## Table of Contents
1. [Health](#health)
2. [Auth](#auth)
3. [Bookmarks](#bookmarks)
4. [Events](#events)
5. [Genres](#genres)
6. [Users](#users)
7. [Venues](#venues)
8. [Drafts](#drafts)
9. [Images](#images)

---

## Health

`GET /api/health`

- Performs a health check of the backend and database connection.
- Returns database status information.
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    status: string,
    message: string | undefined,
    error: string | undefined,
}
```

---

## Auth

`POST /api/auth/login/`

- Returns a new JWT token for the users session based on the provided login information.
- Errors if the login information is invalid.

- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    email: string,
    password: string,
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    jwt: string | undefined,
    error: string | undefined,
    success: boolean | undefined,
}
```

## Bookmarks

`GET /api/bookmarks/`

- Returns the users bookmarks based on the JWT Token.
- Errors if the JWT Token is invalid or the user does not exist.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"`
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    bookmarks: [

    ] | undefined
    error: string | undefined
}
```

`POST /api/bookmarks/`

- Bookmarks an event id for a user.
- Errors if the JWT Token is invalid, the user does not exist, or the event does not exist.
- Does nothing if the user has already bookmarked the event.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"`
    - `Accept: "application/json"`
    - `Content-Type: "application/json"`
- ##### Request Body

```
{
	eventId: number
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
	success: boolean | undefined
	error: string | undefined
}
```

`DELETE /api/bookmarks/`

- Deletes a bookmarked event for a user.
- Errors if the JWT Token is invalid, the user does not exist, the event does not exist.
- Does nothing if the user has not bookmarked the event.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"`
    - `Accept: "application/json"`
    - `Content-Type: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
	success: boolean | undefined
	error: string | undefined
}
```

## Events

`GET /api/events`

- Gets all events matching the passed in parameters. If no parameters are passed, it returns all events. The Errors if there is an internal error connecting to the database
- ##### URL Parameters [All optional]
    - `limit=<number>`
    - `min_start_time=<Date>`
    - `max_start_time=<Date>`
    - `min_cost=<number>`
    - `max_cost=<number>`
    - `latitude=<number>`
    - `longitude=<number>`
    - `radius=<number>`
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
	events: [
	    {
                id: string,
                title: string,
                description: string | undefined,
                start_time: string, (Date String)
                cost: number | undefined,
                status: string | undefined, (Event Status Enum)
                created_at: string, (Date String)
                source_type: string | undefined, (Source Type Enum)
                source_url: string | undefined,
                artist: string | undefined
                venues: {
                	id: number,
                	name: string,
                	address: string | undefined,
                	type: string | undefined (Venue Type Enum)
                },
                genres: [
                    genre_id: string,
                    genres: {
                        id: string,
                        name: string,
                    },
                ] | undefined,
        }
    ] | undefined,
    count: number | undefined,
    error: string | undefined,
}
```

`POST /api/events`

- Creates an event with the provided fields. The associated venue must be created before this endpoint is used, otherwise the endpoint will fail
- Errors if the JWT Token is invalid, the associated venue does not exist.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    title: string,
    description: string | undefined
    venue_id: number,
    start_time: string, (Date String)
    cost: number | undefined,
    status: string | undefined, (Event Status Enum)
    source_type: string | undefined, (Source Type Enum)
    source_url: string | undefined,
    artist_id: string | undefined
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
	id: string | undefined
	success: bool | undefined
	error: string | undefined
}
```

`GET /api/events/:id`

- Retrieves a specific event by ID.
- Errors if the event does not exist.
- ##### URL Parameters
    - `id=<string>` (Required)
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    event: {
        id: string,
        title: string,
        description: string | undefined,
        start_time: string (Date String),
        cost: number | undefined,
        status: string | undefined,
        created_at: string (Date String),
        source_type: string | undefined,
        source_url: string | undefined,
        artist: string | undefined,
        venues: {
            id: number,
            name: string,
            address: string | undefined,
            type: string | undefined
        },
        genres: [
            {
                genre_id: string,
                genres: {
                    id: string,
                    name: string
                }
            }
        ] | undefined
    } | undefined,
    error: string | undefined
}
```

`POST /api/events/updateEvent`

- Updates an existing event with new information.
- Errors if the event ID is missing or if there is a database error.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body [All fields optional except id]

```
{
    id: string (Required),
    title: string | undefined,
    description: string | undefined,
    venue_id: string | undefined,
    start_time: string | undefined (Date String),
    cost: number | undefined,
    status: string | undefined (Event Status Enum),
    source_type: string | undefined (Source Type Enum),
    source_url: string | undefined,
    image: string | undefined,
    artist_id: string | undefined,
    genreIds: [string] | undefined
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    id: string | undefined,
    success: boolean | undefined,
    error: string | undefined
}
```

`DELETE /api/events/deleteEvent`

- Deletes an event by ID.
- Errors if the event ID is missing or if the event does not exist.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    id: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`POST /api/events/archiveEvent`

- Archives an event (marks it as archived without deleting).
- Errors if the event ID is missing or if the event does not exist.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    id: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`POST /api/events/unarchiveEvent`

- Unarchives a previously archived event.
- Errors if the event ID is missing or if the event does not exist.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    id: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`POST /api/events/archivePastEvents`

- Batch archives all events with start times in the past.
- Used for maintenance to keep event database clean.
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`POST /api/events/:id/genres`

- Adds a genre to an event.
- Errors if the event ID or genre ID is missing.
- ##### URL Parameters
    - `id=<string>` (Required - Event ID)
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    genreId: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    data: any | undefined,
    error: string | undefined
}
```

`DELETE /api/events/:id/genres/:genreId`

- Removes a genre from an event.
- Errors if the event ID or genre ID is missing.
- ##### URL Parameters
    - `id=<string>` (Required - Event ID)
    - `genreId=<string>` (Required - Genre ID)
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`PUT /api/events/:id/genres`

- Replaces all genres for an event with the provided list.
- Errors if the event ID is missing or if genreIds is not an array.
- ##### URL Parameters
    - `id=<string>` (Required - Event ID)
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    genreIds: [string] (Required - Array of Genre IDs)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    data: any | undefined,
    error: string | undefined
}
```

---

## Genres

`GET /api/genres`

- Returns all venues or a specific genre if a name is passed.
- Errors if an invalid name is passed
- ##### URL Parameters [Optional]
    - `name=<string>`
- ##### Request Headers
    - `Accept: “application/json”`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    genre: {
        id: string,
        name: string,
    } | undefined,
    genres: [
        {
            id: string,
            name: string,
        }
    ] | undefined,
    error: string | undefined,
}
```

`POST /api/genres`

- Creates a genre using the provided name.
- Errors if no name or an already existing name is passed

- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    name: string,
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    id: string | undefined
    success: bool | undefined
    error: string | undefined
}
```

## Users

`GET /api/users/`

- Returns the current user session information based on the JWT Token.
- Errors if the JWT token is invalid.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"`
    - `Accept: “application/json”`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    user: {
        name: string,
        email: string,
        id: string,
    } | undefined,
    error: string | undefined,
}
```

`POST /api/users/`

- Attempts to create and authenticate a user using the provided credentials and information, returns a JWT for the new user.
- Errors if the email is already in use and the password does not match.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    email: string,
    password: string,
    name: string | undefined,
    username: string | undefined,
    profile_pictrue: string,
    bio: string | undefined
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    jwt: string | undefined
    success: bool | undefined
    error: string | undefined
}
```

`PUT /api/users/:userId`

- Updates the user's profile information.
- Errors if the JWT Token is invalid or if the `userId` in the URL does not match the authenticated user's ID.
- ##### URL Parameters
    - `userId=<string>` (Required)
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"`
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body [All fields optional]

```
{
    name: string | undefined,
    username: string | undefined,
    profile_picture: string | undefined,
    bio: string | undefined
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    user: {
            id: string, 
            name: string | undefined,
            username: string | undefined,
            profile_picture: string | undefined,
            bio: string | undefined
          } | undefined,
    error: string | undefined
}
```

`GET /api/users/suggested-events`

- Returns personalized event suggestions for the current user (passed through the JWT token).
- Errors if the JWT token is invalid.
- ##### URL Parameters [Optional]
    - `limit=<number>`
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"`
    - `Accept: “application/json”`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    events: [
      {
        user_id: string,
        event_id: string,
        title: string,     
        description: string | undefined,  
        venue_id: string,
        start_time: string (Date String),
        cost: number | undefined,
        status: string | undefined (Event Status Enum),        
        created_at: string (Date String),
        source_type: string (Source Type Enum),    
        source_url: string | undefined,
        ingestion_status: string | undefined (Ingestion Status Enum),
        image: string | undefined, 
        artist_id: string | undefined,
        archived: boolean,
        score: number,
        venues: {
            id: string,
            name: string,
            address: string | undefined,
            venue_type: string (Venue Type) | undefined,
            latitude: number | undefined,
            longitude: number | undefined,
        },
        event_genres: [
            {
                genres: {
                    id: string,
                    name: string
                },       
                genre_id: string
            }
        ] | undefined,
        artists: {
            id: string,
            bio: string | undefined,
            name: string,    
            image: string | undefined
        } | undefined
      },
    ] | undefined
    success: boolean | undefined,
    error: string | undefined,
}
```

`POST /api/users/addGenre` 🔐

- Adds a genre to the current user's favorite genres list.
- Requires authentication via JWT token.
- Errors if the genre ID is missing or if the user is unauthorized.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"` (Required)
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    genreId: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`DELETE /api/users/removeGenre` 🔐

- Removes a genre from the current user's favorite genres list.
- Requires authentication via JWT token.
- Errors if the genre ID is missing or if the user is unauthorized.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"` (Required)
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    genreId: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`POST /api/users/addVenue` 🔐

- Adds a venue to the current user's favorite venues list.
- Requires authentication via JWT token.
- Errors if the venue ID is missing or if the user is unauthorized.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"` (Required)
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    venueId: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`DELETE /api/users/removeVenue` 🔐

- Removes a venue from the current user's favorite venues list.
- Requires authentication via JWT token.
- Errors if the venue ID is missing or if the user is unauthorized.
- ##### Request Headers
    - `Authorization: "Bearer <JWT Token>"` (Required)
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    venueId: string (Required)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

---

## Venues

`GET /api/venues`

- Returns all venues or a specific venue if an id is passed.
- Errors if an invalid venue id is passed
- ##### URL Parameters [Optional]
    - `id=<string>`
- ##### Request Headers
    - `Accept: “application/json”`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    venue: {
        id: string,
        name: string,
        address: string | undefined,
        venue_type: string (Venue Type) | undefined,
        latitude: number | undefined,
        longitude: number | undefined,
    } | undefined,
    venues: [
        {
            id: string,
            name: string,
            address: string | undefined,
            venue_type: string (Venue Type) | undefined,
            latitude: number | undefined,
            longitude: number | undefined,
        }
    ] | undefined,
    error: string | undefined,
}
```

`POST /api/venues`

- Creates a venue with the provided information
- Errors if the name is undefined
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    name: string,
    address: string | undefined
    venue_type: string (Venue Type) | undefined,
    latitude: number | undefined,
    longitude: number | undefined,
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    id: string | undefined
    success: bool | undefined
    error: string | undefined
}
```

---

## Drafts

`GET /api/drafts/`

- Returns all draft events matching the passed in parameters for a specific user. If no parameters are passed, returns all drafts.
- Errors if there is an internal error connecting to the database
- ##### URL Parameters [All optional]
    - `limit=<number>` (default: 20)
    - `min_start_time=<Date>`
    - `max_start_time=<Date>`
    - `min_cost=<number>`
    - `max_cost=<number>`
    - `userId=<string>`
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    drafts: [
        {
            id: string,
            title: string,
            description: string,
            start_time: string (Date String),
            cost: number,
            user_id: string,
            source_url: string | undefined,
            image: string | undefined,
            venue_id: string | undefined,
            venue_name: string | undefined,
            venue_address: string | undefined,
            venue_type: string | undefined,
            venue_latitude: number | undefined,
            venue_longitude: number | undefined,
            artist_id: string | undefined,
            artist_name: string | undefined,
            artist_bio: string | undefined,
            artist_image: string | undefined,
            created_at: string (Date String)
        }
    ] | undefined,
    count: number | undefined,
    error: string | undefined,
}
```

`POST /api/drafts/upload`

- Creates a new draft event with the provided fields.
- Errors if required fields are missing or if the start_time is in the past.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    title: string (Required),
    description: string (Required),
    start_time: string (Required, Date String - must be in future),
    cost: number (Required),
    user_id: string (Required),
    source_url: string | undefined,
    image: string | undefined,
    venue_id: string | undefined,
    venue_name: string | undefined,
    venue_address: string | undefined,
    venue_type: string | undefined,
    venue_latitude: number | undefined,
    venue_longitude: number | undefined,
    artist_id: string | undefined,
    artist_name: string | undefined,
    artist_bio: string | undefined,
    artist_image: string | undefined
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    id: string | undefined,
    success: boolean | undefined,
    error: string | undefined
}
```

`GET /api/drafts/:id`

- Retrieves a specific draft event by ID.
- Errors if the draft does not exist.
- ##### URL Parameters
    - `id=<string>` (Required)
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    draft: {
        id: string,
        title: string,
        description: string,
        start_time: string (Date String),
        cost: number,
        user_id: string,
        source_url: string | undefined,
        image: string | undefined,
        venue_id: string | undefined,
        venue_name: string | undefined,
        venue_address: string | undefined,
        venue_type: string | undefined,
        venue_latitude: number | undefined,
        venue_longitude: number | undefined,
        artist_id: string | undefined,
        artist_name: string | undefined,
        artist_bio: string | undefined,
        artist_image: string | undefined,
        created_at: string (Date String)
    } | undefined,
    error: string | undefined
}
```

`DELETE /api/drafts/:id`

- Deletes a draft event by ID.
- Errors if the draft does not exist or if the ID is missing.
- ##### URL Parameters
    - `id=<string>` (Required - pass in request body)
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    id: string
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    error: string | undefined
}
```

`POST /api/drafts/updateDraft`

- Updates an existing draft event with new information.
- Errors if the draft ID is missing or if there is a database error.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body [All fields optional except id]

```
{
    id: string (Required),
    title: string | undefined,
    description: string | undefined,
    start_time: string | undefined (Date String),
    cost: number | undefined,
    source_url: string | undefined,
    image: string | undefined,
    venue_id: string | undefined,
    venue_name: string | undefined,
    venue_address: string | undefined,
    venue_type: string | undefined,
    venue_latitude: number | undefined,
    venue_longitude: number | undefined,
    artist_id: string | undefined,
    artist_name: string | undefined,
    artist_bio: string | undefined,
    artist_image: string | undefined
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    id: string | undefined,
    success: boolean | undefined,
    error: string | undefined
}
```

`POST /api/drafts/publish/:id`

- Publishes a draft event by converting it into an actual event. Creates associated venue and artist records if they don't already exist, then deletes the draft.
- Errors if the draft ID is missing or if there is a database error during event creation.
- ##### URL Parameters
    - `id=<string>` (Required)
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    event: {
        id: string,
        title: string,
        description: string | undefined,
        start_time: string (Date String),
        cost: number | undefined,
        status: string | undefined,
        created_at: string (Date String),
        source_type: string | undefined,
        source_url: string | undefined,
        artist_id: string | undefined,
        venue_id: string,
        image: string | undefined
    } | undefined,
    success: boolean | undefined,
    error: string | undefined
}
```

---

## Images

`POST /api/images/:bucket`

- Uploads an image to the specified bucket (events, artists, or users).
- Supports multipart form data upload with file size limit of 5MB.
- ##### URL Parameters
    - `bucket=<string>` (Required - one of: `events`, `artists`, `users`)
- ##### Query Parameters [Optional]
    - `id=<string>` (Optional ID for the image; if not provided, a random UUID is generated)
- ##### Request Headers
    - `Content-Type: multipart/form-data`
- ##### Request Body
    - Form field `image` containing the image file (binary)
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean,
    url: string | undefined,
    filename: string | undefined,
    error: string | undefined
}
```

`GET /api/images/:bucket/:filename`

- Retrieves a public URL for an image or redirects to the image.
- Returns JSON response if `?format=json` query parameter or `Accept: application/json` header is present.
- Otherwise redirects to Supabase public URL for direct image viewing.
- ##### URL Parameters
    - `bucket=<string>` (Required - one of: `events`, `artists`, `users`)
    - `filename=<string>` (Required)
- ##### Query Parameters [Optional]
    - `format=json` (Optional - returns JSON response instead of redirect)
- ##### Request Headers
    - `Accept: "application/json"` (Optional - returns JSON response instead of redirect)
- ##### Response Headers
    - `Content-Type: "application/json"` or `Content-Type: image/*` depending on format
- ##### Response Body (JSON format)

```
{
    success: boolean,
    url: string | undefined,
    error: string | undefined
}
```

`DELETE /api/images/:bucket/:filename`

- Deletes an image from the specified bucket by filename.
- Errors if the image does not exist or if the bucket/filename are invalid.
- ##### URL Parameters
    - `bucket=<string>` (Required - one of: `events`, `artists`, `users`)
    - `filename=<string>` (Required)
- ##### Request Headers
    - `Accept: "application/json"`
- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    message: string | undefined,
    error: string | undefined
}
```

`DELETE /api/images`

- Deletes an image by bucket and URL (from request body).
- Errors if the bucket and URL are not provided or if the image does not exist.
- ##### Request Headers
    - `Content-Type: "application/json"`
    - `Accept: "application/json"`
- ##### Request Body

```
{
    bucket: string (Required - one of: `events`, `artists`, `users`),
    url: string (Required - the image filename or URL)
}
```

- ##### Response Headers
    - `Content-Type: "application/json"`
- ##### Response Body

```
{
    success: boolean | undefined,
    message: string | undefined,
    error: string | undefined
}
```
