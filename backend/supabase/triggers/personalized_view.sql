drop VIEW personalized_event_suggestions;

CREATE OR REPLACE VIEW personalized_event_suggestions AS
select *,
(
  CASE WHEN artist_id in (SELECT artist_id FROM user_favorite_artists WHERE user_id = matches.user_id) THEN 5 ELSE 0 END +
  CASE WHEN venue_id in (SELECT venue_id FROM user_favorite_venues WHERE user_id = matches.user_id) THEN 3 ELSE 0 END +
  (select count(*) FROM event_genres as eg INNER JOIN user_favorite_genres as fg ON eg.genre_id = fg.genre_id WHERE eg.event_id = matches.event_id AND fg.user_id = matches.user_id)
) as score
FROM (
  select distinct
  u.id as user_id, 
  e.id as event_id,
  e.title,
  e.description,
  e.venue_id,
  e.start_time,
  e.cost,
  e.status,
  e.created_at,
  e.source_type,
  e.source_url,
  e.ingestion_status,
  e.image,
  e.artist_id,
  e.archived
  from
  public.users as u
  cross join (select * from public.events where start_time > CURRENT_TIMESTAMP AND start_time <= CURRENT_TIMESTAMP + INTERVAL '30 days' AND archived <> true) as e
) as matches;