# Corkboard API Docs

This document provides the input and output specification for all of Corkboard's Backend Endpoints.

### Important Notes

- All dates should be passed as a string, convereted using the method .toISOString()

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
    source_url: string | undefined
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
            id: string, name: string | undefined,
            username: string | undefined,
            profile_picture: string | undefined,
            bio: string | undefined
          } | undefined,
    error: string | undefined
}
```

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
