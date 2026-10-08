export async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export const postJson = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
export const putJson = (path, body) => api(path, { method: 'PUT', body: JSON.stringify(body) });
