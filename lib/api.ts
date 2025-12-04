// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// PUBLIC ROUTE PREFIXES (must NOT send Authorization header)
const PUBLIC_PREFIXES = [
  '/signup',
  '/signin',
  '/refresh',
  '/logout',
  '/resend-otp',
  '/verify-otp',
  '/setup-password',
  '/roles',
  '/stripe/webhook',
  '/learning', // IMPORTANT → makes course + lesson endpoints public
];

// Check if URL starts with a public prefix
function isPublic(url?: string) {
  if (!url) return false;
  return PUBLIC_PREFIXES.some(prefix => url.startsWith(prefix));
}

api.interceptors.request.use(
  (config) => {
    const url = config.url ?? '';

    // Do NOT attach token for public routes
    if (isPublic(url)) {
      return config;
    }

    // Otherwise attach token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
