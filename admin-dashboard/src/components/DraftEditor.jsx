import { useState } from "react";
import { updateDraft, deleteDraft, publishDraft } from "../corkboardApi";


export default function DraftEditor({ event, form, setForm, dirty, onCopyDraft, refresh }) {
  const [loading, setLoading] = useState(false);
  if (!event) return <div>Select a draft</div>;

  const onSave = async () => {
    setLoading(true);
    try {
      const result = await updateDraft(form, event.id);
      if (result.success) {
        console.log("Draft updated successfully");
        if (refresh) refresh();
      } else {
        console.error("Failed to update draft:", result.error);
      }
    } catch (error) {
      console.error("Error updating draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptDraft = async () => {
    if (!window.confirm("Publish this draft as a live event?")) return;
    setLoading(true);
    try {
      const result = await publishDraft(event.id);
      if (result.success) {
        console.log("Draft published successfully");
        if (refresh) refresh();
      } else {
        console.error("Failed to publish draft:", result.error);
      }
    } catch (error) {
      console.error("Error publishing draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const rejectDraft = async () => {
    if (!window.confirm("Are you sure you want to delete this draft? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const result = await deleteDraft(event.id);
      if (result.success) {
        console.log("Draft deleted successfully");
        if (refresh) refresh();
      } else {
        console.error("Failed to delete draft:", result.error);
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 style={{ marginTop: 0 }}>Draft - View / Edit</h3>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
        Draft ID: {event.id} • Submitted by: {event.users?.name || event.users?.username || event.user_id || "Unknown"}
        {dirty ? " • Unsaved changes" : ""}
      </div>

      <div style={{ display: "grid", gap: 20, width: "100%", paddingBottom: 40 }}>
        {event.image && (
          <label>
            <div style={{ marginBottom: 8 }}>Draft Image</div>
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
        )}

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
            <div>Artist Name</div>
            <input
              value={form.artist_name}
              onChange={(e) => setForm((f) => ({ ...f, artist_name: e.target.value }))}
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <label>
          <div>Artist Bio</div>
          <textarea
            value={form.artist_bio}
            onChange={(e) => setForm((f) => ({ ...f, artist_bio: e.target.value }))}
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </label>

        <label>
          <div>Description</div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={8}
            style={{ width: "100%", resize: "vertical" }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            <div>Venue Name</div>
            <input
              value={form.venue_name}
              onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <div>Venue Address</div>
            <input
              value={form.venue_address}
              onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))}
              style={{ width: "100%" }}
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

        <label>
          <div>Submitted by (User ID)</div>
          <input
            disabled={true}
            value={event.user_id || ""}
            style={{ width: "100%", opacity: 0.7 }}
          />
        </label>

        {/* buttons */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            disabled={loading || !dirty}
            onClick={onSave}
            title="Save changes to the server"
            style={{ padding: "10px 14px", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            Save
          </button>

          <button
            disabled={loading}
            onClick={acceptDraft}
            style={{ padding: "10px 14px", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer", background: "azure" }}
          >
            Publish
          </button>

          <button
            disabled={loading}
            onClick={rejectDraft}
            style={{ padding: "10px 14px", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer", background: "mistyrose" }}
          >
            Reject
          </button>

          <button onClick={onCopyDraft} style={{ padding: "10px 14px" }}>
            Copy draft JSON
          </button>
        </div>

        <details style={{ marginTop: 8 }}>
          <summary>Raw draft object</summary>
          <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify(event, null, 2)}
          </pre>
        </details>
      </div>
    </>
  );
}
