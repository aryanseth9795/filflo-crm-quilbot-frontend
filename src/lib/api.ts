import axios from 'axios';


const envmodePROD  = true;
const baseURL = envmodePROD ? "https://filfo-crm-quilbot-backend.onrender.com/api" : "http://localhost:5000/api";

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Silent Token Refresh Interceptor ────────────────────────────────────────
// Prevents multiple concurrent refresh attempts with a simple flag + queue
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Attempt silent refresh on 401, but not for:
    //  - auth endpoints themselves (avoid infinite loops)
    //  - multipart/form-data requests (FormData streams cannot be replayed after consumption)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    const isMultipart = (originalRequest.headers?.['Content-Type'] || originalRequest.headers?.['content-type'] || '')
      .toString().includes('multipart/form-data');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isMultipart
    ) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest)).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh', {}, { withCredentials: true });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Clear persisted auth state and redirect to login
        localStorage.removeItem('filflo-auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Unwrap error message for all other errors
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

/** Upload files as multipart/form-data */
export function createFormData(fields: Record<string, string | number | undefined>, files?: File[], fileField = 'attachments'): FormData {
  const form = new FormData();
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) form.append(key, String(val));
  }
  if (files) {
    files.forEach(f => form.append(fileField, f));
  }
  return form;
}

export default api;
