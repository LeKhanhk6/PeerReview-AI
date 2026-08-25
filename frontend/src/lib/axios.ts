import axios from 'axios';

// Create a configured axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// We can add interceptors here later for JWT token parsing
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // You can handle global errors here like 401 Unauthorized
    return Promise.reject(error.response?.data || error);
  }
);
