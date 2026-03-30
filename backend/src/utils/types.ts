type VenueType =
    | "bar"
    | "club"
    | "theater"
    | "venue"
    | "outdoor"
    | "other"
    | undefined;

type IngestionType =
    | "manual"
    | "api"
    | "scraping"
    | "rss"
    | "ics"
    | "other"
    | undefined;

type EventStatus = "draft" | "hidden" | "published" | undefined;

type IngestionStatus =
    | "pending"
    | "processing"
    | "success"
    | "failed"
    | undefined;

const ENV_VALUES = ["test", "development", "production"] as const; // type: readonly
export type NODE_ENVS = (typeof ENV_VALUES)[number];

export type Event = {
  title: string;
  description: string;
  start_time: Date;
  cost: number | null;
  source_url: string;
  image: string;
  artist: string | null;
  genres: string[];
};

export { ENV_VALUES };
