export default function EventList({ events, selectedId, onSelect }) {
  return (
    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
      {events.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          style={{
            textAlign: "left",
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: e.id === selectedId ? "#f3f3f3" : "white",
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: 600 }}>{e.title}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {new Date(e.start_time).toLocaleString()} • {e.venues?.name || "Unknown venue"}
          </div>
        </button>
      ))}
    </div>
  );
}
