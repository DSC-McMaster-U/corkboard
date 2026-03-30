import { useState } from "react";
import { updateDraft, deleteDraft, publishDraft } from "../corkboardApi";


export default function DraftEditor({ event, form, setForm, dirty, onCopyDraft, refresh }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  if (!event) return <div>Select a draft</div>;

  const hasLinkedVenue = Boolean(event.venue_id && event.venues);
  const hasLinkedArtist = Boolean(event.artist_id && event.artists);

  const sectionStyle = {
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 16,
    background: "#fff",
  };

  const imagePreviewStyle = {
    width: "100%",
    maxHeight: 220,
    objectFit: "contain",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    border: "1px solid #eee",
  };

  const onSave = async () => {
    const payload = {
      ...form,
      venue_id: form.venue_id?.trim() || undefined,
      artist_id: form.artist_id?.trim() || undefined,
      venue_type: form.venue_type?.trim() || undefined,
      venue_latitude:
        form.venue_latitude === "" ? undefined : Number(form.venue_latitude),
      venue_longitude:
        form.venue_longitude === "" ? undefined : Number(form.venue_longitude),
      cost: form.cost === "" ? undefined : Number(form.cost),
    };

    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const result = await updateDraft(payload, event.id);
      if (result.success) {
        setMsg("Draft saved successfully.");
        if (refresh) refresh();
      } else {
        setErr(result.error || "Save failed.");
      }
    } catch (error) {
      setErr(error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const acceptDraft = async () => {
    console.log("[publish] button clicked, draft id:", event.id);
    if (!window.confirm("Are you sure you want to publish this draft as a live event?")) {
      console.log("[publish] cancelled by user");
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      console.log("[publish] calling publishDraft...");
      const result = await publishDraft(event.id);
      console.log("[publish] result:", result);
      if (result.success) {
        setMsg("Draft published successfully!");
        if (refresh) refresh();
      } else {
        setErr(result.error || "Publish failed.");
      }
    } catch (error) {
      console.error("[publish] caught error:", error);
      setErr(error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const rejectDraft = async () => {
    if (!window.confirm("Are you sure you want to delete this draft? This action cannot be undone.")) { return; }
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const result = await deleteDraft(event.id);
      if (result.success) {
        setMsg("Draft deleted.");
        if (refresh) refresh();
      } else {
        setErr(result.error || "Delete failed.");
      }
    } catch (error) {
      setErr(error.message || String(error));
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

      {err && <div style={{ color: "crimson", background: "#fff0f0", border: "1px solid #f5c6cb", borderRadius: 8, padding: "10px 14px", marginBottom: 12, whiteSpace: "pre-wrap" }}>{err}</div>}
      {msg && <div style={{ color: "green", background: "#f0fff4", border: "1px solid #b7ebc0", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>{msg}</div>}

      <div style={{ display: "grid", gap: 20, width: "100%", paddingBottom: 40 }}>
        <section style={sectionStyle}>
          <h4 style={{ marginTop: 0, marginBottom: 12 }}>Event Information</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              <div>Draft ID</div>
              <input disabled={true} value={event.id || ""} style={{ width: "100%", opacity: 0.7 }} />
            </label>
            <label>
              <div>Source URL</div>
              <input
                value={form.source_url}
                onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            <label>
              <div>Title</div>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              <div>Image URL</div>
              <input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 12 }}>
            <div>Description</div>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={6}
              style={{ width: "100%", resize: "vertical" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            <label>
              <div>Start Time</div>
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

          {(form.image || event.image) && (
            <label style={{ display: "block", marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>Draft Image Preview</div>
              <img
                src={form.image || event.image}
                style={{ ...imagePreviewStyle, height: 280 }}
                alt={form.title}
              />
            </label>
          )}
        </section>

        <section style={sectionStyle}>
          <h4 style={{ marginTop: 0, marginBottom: 12 }}>User Information</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              <div>User ID</div>
              <input disabled={true} value={event.user_id || ""} style={{ width: "100%", opacity: 0.7 }} />
            </label>
            <label>
              <div>Name</div>
              <input disabled={true} value={event.users?.name || ""} style={{ width: "100%", opacity: 0.7 }} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            <label>
              <div>Username</div>
              <input disabled={true} value={event.users?.username || ""} style={{ width: "100%", opacity: 0.7 }} />
            </label>
            <label>
              <div>Profile Picture</div>
              <input disabled={true} value={event.users?.profile_picture || ""} style={{ width: "100%", opacity: 0.7 }} />
            </label>
          </div>
          {event.users?.profile_picture && (
            <label style={{ display: "block", marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>Profile Picture Preview</div>
              <img
                src={event.users.profile_picture}
                style={imagePreviewStyle}
                alt={event.users?.name || event.users?.username || "User profile"}
              />
            </label>
          )}
          <label style={{ display: "block", marginTop: 12 }}>
            <div>Bio</div>
            <textarea
              disabled={true}
              value={event.users?.bio || ""}
              rows={3}
              style={{ width: "100%", resize: "vertical", opacity: 0.7 }}
            />
          </label>
        </section>

        <section style={sectionStyle}>
          <h4 style={{ marginTop: 0, marginBottom: 12 }}>Venue Information</h4>
          {hasLinkedVenue ? (
            <>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
                This draft references an existing venue via venue_id.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label>
                  <div>Venue ID</div>
                  <input disabled={true} value={event.venue_id || ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
                <label>
                  <div>Name</div>
                  <input disabled={true} value={event.venues?.name || ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                <label>
                  <div>Address</div>
                  <input disabled={true} value={event.venues?.address || ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
                <label>
                  <div>Type</div>
                  <input disabled={true} value={event.venues?.venue_type || ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                <label>
                  <div>Latitude</div>
                  <input disabled={true} value={event.venues?.latitude ?? ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
                <label>
                  <div>Longitude</div>
                  <input disabled={true} value={event.venues?.longitude ?? ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
                No linked venue_id. This draft includes venue details to create a new venue.
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
                  <div>Venue Type</div>
                  <select
                    value={form.venue_type}
                    onChange={(e) => setForm((f) => ({ ...f, venue_type: e.target.value }))}
                    style={{ width: "100%" }}
                  >
                    <option value="">Select a venue type</option>
                    <option value="bar">bar</option>
                    <option value="club">club</option>
                    <option value="theater">theater</option>
                    <option value="venue">venue</option>
                    <option value="outdoor">outdoor</option>
                    <option value="other">other</option>
                  </select>
                </label>
              </div>
              <label style={{ display: "block", marginTop: 12 }}>
                <div>Venue Address</div>
                <input
                  value={form.venue_address}
                  onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                <label>
                  <div>Venue Latitude</div>
                  <input
                    inputMode="decimal"
                    value={form.venue_latitude}
                    onChange={(e) => setForm((f) => ({ ...f, venue_latitude: e.target.value }))}
                    style={{ width: "100%" }}
                  />
                </label>
                <label>
                  <div>Venue Longitude</div>
                  <input
                    inputMode="decimal"
                    value={form.venue_longitude}
                    onChange={(e) => setForm((f) => ({ ...f, venue_longitude: e.target.value }))}
                    style={{ width: "100%" }}
                  />
                </label>
              </div>
            </>
          )}
        </section>

        <section style={sectionStyle}>
          <h4 style={{ marginTop: 0, marginBottom: 12 }}>Artist Information</h4>
          {hasLinkedArtist ? (
            <>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
                This draft references an existing artist via artist_id.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label>
                  <div>Artist ID</div>
                  <input disabled={true} value={event.artist_id || ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
                <label>
                  <div>Name</div>
                  <input disabled={true} value={event.artists?.name || ""} style={{ width: "100%", opacity: 0.7 }} />
                </label>
              </div>
              <label style={{ display: "block", marginTop: 12 }}>
                <div>Bio</div>
                <textarea
                  disabled={true}
                  value={event.artists?.bio || ""}
                  rows={4}
                  style={{ width: "100%", resize: "vertical", opacity: 0.7 }}
                />
              </label>
              <label style={{ display: "block", marginTop: 12 }}>
                <div>Image URL</div>
                <input disabled={true} value={event.artists?.image || ""} style={{ width: "100%", opacity: 0.7 }} />
              </label>
              {event.artists?.image && (
                <label style={{ display: "block", marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>Artist Image Preview</div>
                  <img
                    src={event.artists.image}
                    style={imagePreviewStyle}
                    alt={event.artists?.name || "Artist"}
                  />
                </label>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
                No linked artist_id. This draft includes artist details to create a new artist.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label>
                  <div>Artist Name</div>
                  <input
                    value={form.artist_name}
                    onChange={(e) => setForm((f) => ({ ...f, artist_name: e.target.value }))}
                    style={{ width: "100%" }}
                  />
                </label>
                <label>
                  <div>Artist Image URL</div>
                  <input
                    value={form.artist_image}
                    onChange={(e) => setForm((f) => ({ ...f, artist_image: e.target.value }))}
                    style={{ width: "100%" }}
                  />
                </label>
              </div>
              <label style={{ display: "block", marginTop: 12 }}>
                <div>Artist Bio</div>
                <textarea
                  value={form.artist_bio}
                  onChange={(e) => setForm((f) => ({ ...f, artist_bio: e.target.value }))}
                  rows={4}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </label>
              {form.artist_image && (
                <label style={{ display: "block", marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>Artist Image Preview</div>
                  <img
                    src={form.artist_image}
                    style={imagePreviewStyle}
                    alt={form.artist_name || "Artist"}
                  />
                </label>
              )}
            </>
          )}
        </section>

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
