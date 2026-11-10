// Central API client. Same-origin /api in Docker (Nginx proxy) and in dev (Vite proxy).
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the API is running.');
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = data?.details && Object.values(data.details)[0];
    const message = detail || data?.error || (res.status >= 500 ? 'The server had a problem. Please try again.' : `Request failed (${res.status})`);
    throw new ApiError(res.status, message, data?.details);
  }
  return data;
}

export const urlsApi = {
  list: () => request('GET', '/urls'),
  stats: () => request('GET', '/urls/stats'),
  create: (originalUrl) => request('POST', '/urls', { original_url: originalUrl }),
  remove: (id) => request('DELETE', `/urls/${id}`),
};
