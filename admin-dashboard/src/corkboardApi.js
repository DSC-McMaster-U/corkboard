const API_BASE = process.env.REACT_APP_API_BASE_URL;

export async function getEvents(limit = 200, includeArchived = false, hideOld = false) {
  const now = new Date();
  const res = await fetch(`${API_BASE}/api/events?limit=${limit}&includeArchived=${includeArchived}${hideOld ? "&min_start_time=" + now.toISOString() : ""}`, {
    headers: { Accept: "application/json" },
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data.events || [];
}

export async function getGenres() {
  const res = await fetch(`${API_BASE}/api/genres`, {
    headers: { Accept: "application/json" },
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data.genres || [];
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

export async function deleteEvent(eventId) {
  const res = await fetch(`${API_BASE}/api/events/deleteEvent`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: eventId,
    }),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data;
}

export async function archiveEvent(eventId) {
  const res = await fetch(`${API_BASE}/api/events/archiveEvent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: eventId,
    }),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data;
}

export async function unarchiveEvent(eventId) {
  const res = await fetch(`${API_BASE}/api/events/unarchiveEvent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: eventId,
    }),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data;
}

export async function archivePastEvents() {
  const res = await fetch(`${API_BASE}/api/events/archivePastEvents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data;
}

export async function getUserDrafts(limit = 200) {
  const res = await fetch(`${API_BASE}/api/events/userDrafts?limit=${limit}`, {
    headers: { Accept: "application/json" },
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data.events || [];
}