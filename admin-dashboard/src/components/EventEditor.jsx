import { useState } from "react";
import { deleteEvent, updateEvent, archiveEvent, unarchiveEvent } from "../corkboardApi";
import GenreSelector from "./GenreSelector";


export default function EventEditor({ event, form, setForm, dirty, onCopyDraft, refresh, allGenres }) {
  const [loading, setLoading] = useState(false);
  if (!event) return <div>Select an event</div>;

  const onSave = async () => {
    setLoading(true);
    try {
      const result = await updateEvent(form, event.id);
      if (result.success) {
        console.log("Event updated successfully");
        if (refresh) refresh();
      } else {
        console.error("Failed to update event:", result.error);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArchive = async () => {
    setLoading(true);
    try {
      const result = event.archived ? await unarchiveEvent(event.id) : await archiveEvent(event.id);
      if (result.success) {
        console.log(`Event ${event.archived ? "unarchived" : "archived"} successfully`);
        if (refresh) refresh();
      } else {
        console.error(`Failed to ${event.archived ? "unarchive" : "archive"} event:`, result.error);
      }
    } catch (error) {
      console.error(`Error ${event.archived ? "unarchiving" : "archiving"} event:`, error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteEvent = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteEvent(event.id);
      if (result.success) {
        console.log("Event deleted successfully");
        if (refresh) refresh();
      } else {
        console.error("Failed to delete event:", result.error);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h3 style={{ marginTop: 0 }}>View / Edit</h3>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
        Event ID: {event.id} • Venue: {event.venues?.name || "Unknown"}
        {dirty ? " • Unsaved changes" : ""}
      </div>

      <div style={{ display: "grid", gap: 20, width: "100%", paddingBottom: 40 }}>
        <label>
          <div style={{ marginBottom: 8 }}>Event Image</div>
          <img
            src={event.image}
            style={{
              width: "100%",
              height: 300,
              objectFit: "contain",
              backgroundColor: "#f9f9f9",
              borderRadius: 12,
              border: "1px solid #eee"
            }}
            alt={form.title}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            <div>Title</div>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <div>Artist</div>
            <input
              value={form.artist}
              onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <label>
          <div>Description</div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={8}
            style={{ width: "100%", resize: "vertical" }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <label>
            <div>Start time</div>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <div>Cost ($)</div>
            <input
              inputMode="decimal"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <div>Status</div>
            <input
              disabled={true}
              value={form.status}
              style={{ width: "100%", opacity: 0.7 }}
            />
          </label>
        </div>

        <label>
          <div>Source URL</div>
          <input
            value={form.source_url}
            onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
            style={{ width: "100%" }}
          />
        </label>

        <GenreSelector
          allGenres={allGenres}
          selectedGenreIds={form.genreIds}
          onChange={(newIds) => setForm((f) => ({ ...f, genreIds: newIds }))}
        />

        {/* buttons */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* save changes button */}
          <button
            disabled={loading || !dirty}
            onClick={onSave}
            title="Save changes to the server"
            style={{ padding: "10px 14px", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            Save
          </button>

          {/* copy draft json button */}
          <button onClick={onCopyDraft} style={{ padding: "10px 14px" }}>
            Copy draft JSON
          </button>

          {/* toggle archive button */}
          <button onClick={toggleArchive} style={{ padding: "10px 14px" }}>
            {event.archived ? "Unarchive" : "Archive"}
          </button>

          {/* delete button */}
          <button
            onClick={() => handleDeleteEvent()}
            style={{ padding: "10px 14px", backgroundColor: "crimson", color: "white", borderRadius: 8 }}
          >
            Delete
          </button>
        </div>

        <details style={{ marginTop: 8 }}>
          <summary>Raw event object</summary>
          <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify(event, null, 2)}
          </pre>
        </details>
      </div>
    </>
  );
}
