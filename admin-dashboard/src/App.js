import { useEffect, useMemo, useState } from "react";
import { getEvents, archivePastEvents, getUserDrafts, getGenres } from "./corkboardApi";
import EventList from "./components/EventList";
import EventEditor from "./components/EventEditor";
import DraftEditor from "./components/DraftEditor";

function toDateTimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function normalize(s) {
  return (s || "").toString().toLowerCase().trim();
}

function eventSearchBlob(e) {
  return normalize(
    [
      e.title,
      e.artist,
      e.description,
      e.source_url,
      e.venues?.name,
      e.venues?.address,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    cost: "",
    status: "",
    source_url: "",
    artist: "",
    genreIds: [],
  });

  const [allGenres, setAllGenres] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  const [includeArchived, setIncludeArchived] = useState(false);
  const [viewDrafts, setViewDrafts] = useState(false);
  const [hideOld, setHideOld] = useState(true);

  const filteredSortedEvents = useMemo(() => {
    const q = normalize(search);
    const list = [...events];

    list.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    if (!q) return list;
    return list.filter((e) => eventSearchBlob(e).includes(q));
  }, [events, search]);

  const selected = useMemo(
    () => filteredSortedEvents.find((e) => e.id === selectedId) || null,
    [filteredSortedEvents, selectedId]
  );

  useEffect(() => {
    if (!filteredSortedEvents.length) {
      setSelectedId(null);
      return;
    }
    const stillExists = filteredSortedEvents.some((e) => e.id === selectedId);
    if (!stillExists) setSelectedId(filteredSortedEvents[0].id);
  }, [filteredSortedEvents, selectedId, includeArchived, viewDrafts]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    const baseline = {
      title: selected.title || "",
      description: selected.description || "",
      start_time: toDateTimeLocal(selected.start_time),
      cost: selected.cost === null || selected.cost === undefined ? "" : String(selected.cost),
      status: selected.status || "",
      source_url: selected.source_url || "",
      artist: selected.artist || "",
      genreIds: selected.event_genres?.map(eg => eg.genre_id) || [],
    };
    return Object.keys(baseline).some((k) => {
      if (k === "genreIds") {
        return JSON.stringify((baseline[k] || []).sort()) !== JSON.stringify((form[k] || []).sort());
      }
      return baseline[k] !== form[k];
    });
  }, [selected, form]);

  async function refresh() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      if (viewDrafts) {
        const drafts = await getUserDrafts();
        setEvents(drafts);
        setMsg(`Loaded ${drafts.length} drafts`);
      } else {
        const list = await getEvents(200, includeArchived, hideOld);
        setEvents(list);
        setMsg(`Loaded ${list.length} events`);
      }
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchGenres() {
    try {
      const gList = await getGenres();
      setAllGenres(gList);
    } catch (e) {
      console.error("Error fetching genres:", e);
    }
  }

  useEffect(() => {
    refresh();
    fetchGenres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    setForm({
      title: selected.title || "",
      description: selected.description || "",
      start_time: toDateTimeLocal(selected.start_time),
      cost: selected.cost === null || selected.cost === undefined ? "" : String(selected.cost),
      status: selected.status || "",
      source_url: selected.source_url || "",
      artist: selected.artist || "",
      genreIds: selected.event_genres?.map(eg => eg.genre_id) || [],
    });
    setErr(null);
    setMsg(null);
  }, [selected]);

  function copyDraftJson() {
    const payload = {
      id: selected?.id,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : undefined,
      cost: form.cost === "" ? undefined : Number(form.cost),
      status: form.status.trim() || undefined,
      source_url: form.source_url.trim() || undefined,
      artist: form.artist.trim() || undefined,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setMsg("Copied draft JSON to clipboard.");
  }

  const handleArchivePastEvents = async () => {
    setLoading(true);
    try {
      const result = await archivePastEvents();
      if (result.success) {
        console.log("Past events archived successfully");
        refresh();
      } else {
        console.error("Failed to archive past events:", result.error);
      }
    } catch (error) {
      console.error("Error archiving past events:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "100vh" }}>
      <div className="sidebar" style={{ padding: 16, overflow: "auto", borderRight: "1px solid #eee" }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>Corkboard Admin</h2>

        <div style={{ display: "flex", flexDirection: "row", gap: 12, marginBottom: 12, fontSize: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={viewDrafts}
              disabled={loading}
              onChange={(e) => setViewDrafts(e.target.checked)}
            />{" "}
            View Drafts
          </label>
          <label>
            <input
              type="checkbox"
              checked={includeArchived}
              disabled={loading || viewDrafts}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />{" "}
            Include archived
          </label>
          <label>
            <input
              type="checkbox"
              checked={hideOld}
              disabled={loading || viewDrafts}
              onChange={(e) => setHideOld(e.target.checked)}
            />{" "}
            Hide Old
          </label>
        </div>

        <div style={{ flexDirection: "row", display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh events"}
          </button>
          <button onClick={handleArchivePastEvents} disabled={loading || viewDrafts}>
            {loading ? "Archiving..." : "Archive past events"}
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, venue, artist..."
          style={{
            width: "100%",
            marginBottom: 10,
            boxSizing: "border-box"
          }}
        />

        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Showing {filteredSortedEvents.length} of {events.length}
        </div>

        {err && <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{err}</div>}
        {msg && <div style={{ color: "green" }}>{msg}</div>}

        <EventList
          events={filteredSortedEvents}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div style={{ padding: 16, overflow: "auto" }}>
        {viewDrafts ?
          (<DraftEditor
            event={selected}
            form={form}
            setForm={setForm}
            dirty={dirty}
            onCopyDraft={copyDraftJson}
            refresh={refresh}
            allGenres={allGenres}
          />) :
          (<EventEditor
            event={selected}
            form={form}
            setForm={setForm}
            dirty={dirty}
            onCopyDraft={copyDraftJson}
            refresh={refresh}
            allGenres={allGenres}
          />)
        }
      </div>
    </div>
  );
}
