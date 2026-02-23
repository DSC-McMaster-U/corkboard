const API_BASE = process.env.REACT_APP_API_BASE_URL;

export async function getEvents(limit = 200) {
  const res = await fetch(`${API_BASE}/api/events?limit=${limit}`, {
    headers: { Accept: "application/json" },
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data.events || [];
}

export async function updateEvent(form, eventId) {
  const res = await fetch(`${API_BASE}/api/events/updateEvent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...form,
      id: eventId,
    }),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data;
}