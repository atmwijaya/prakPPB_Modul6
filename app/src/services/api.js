import { BACKEND_URL } from "./config.js";
import { supabase } from "./supabaseClient.js";

async function request(path, options = {}) {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL is not set in app.json");
  }

  // Get current session untuk protected routes
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Tambahkan token untuk protected endpoints
  if (token && path.includes('/api/thresholds')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const Api = {
  getSensorReadings() {
    return request("/api/readings");
  },
  getThresholds() {
    return request("/api/thresholds");
  },
  createThreshold(payload) {
    return request("/api/thresholds", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};