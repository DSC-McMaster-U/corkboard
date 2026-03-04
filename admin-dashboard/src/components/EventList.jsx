export default function EventList({ events, selectedId, onSelect }) {
  return (
    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
      {events.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          style={{
            textAlign: "left",
            padding: "12px 14px",
            border: "1px solid",
            borderColor: selectedId === e.id ? "#007bff" : "#eee",
            borderRadius: 10,
            background: e.archived ? "#f9f9f9" : selectedId === e.id ? "#f0f7ff" : "white",
            cursor: "pointer",
            boxShadow: selectedId === e.id ? "0 2px 8px rgba(0,123,255,0.1)" : "none",
            display: "block",
            width: "100%"
          }}
        >
          <div style={{ fontWeight: 600, color: e.archived ? "#888" : "#1a1a1a", fontSize: 14 }}>{e.title}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            {new Date(e.start_time).toLocaleDateString()} • {e.venues?.name || "Unknown venue"}
          </div>
        </button>
      ))}
    </div>
  );
}
