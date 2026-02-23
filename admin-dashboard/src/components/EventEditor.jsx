import { useState } from "react";
import { deleteEvent, updateEvent, archiveEvent, unarchiveEvent } from "../corkboardApi";

function toDateTimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EventEditor({ event, form, setForm, dirty, onCopyDraft, refresh }) {
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
      <h3 style={{ marginTop: 0 }}>View / Edit (not saved yet)</h3>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
        Event ID: {event.id} • Venue: {event.venues?.name || "Unknown"}
        {dirty ? " • Unsaved changes" : ""}
      </div>

      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <label>
          <div>Title</div>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Description</div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={6}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Start time</div>
          <input
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
            style={{ width: "fit-content", padding: 8 }}
          />
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            Current: {new Date(event.start_time).toLocaleString()} ({event.start_time})
          </div>
        </label>

        <label>
          <div>Cost</div>
          <input
            inputMode="decimal"
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            style={{ width: 200, padding: 8 }}
          />
        </label>

        <label>
          <div>Status</div>
          <input
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            style={{ width: 260, padding: 8 }}
          />
        </label>

        <label>
          <div>Artist</div>
          <input
            value={form.artist}
            onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Source URL</div>
          <input
            value={form.source_url}
            onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

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
