import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add CSRF token
api.interceptors.request.use((config) => {
  if (config.method !== 'get') {
    const csrfToken = Cookies.get('sid'); // In some Frappe versions, it uses the sid or a specific csrf_token cookie
    // However, Frappe's standard is often a cookie named 'system_user' or just using the header from a previous response.
    // For Proxied requests, the browser handles the cookie, but we need to send the X-Frappe-CSRF-Token.
    // We can try to get 'frappe_csrf_token' or 'sid'.
    const token = Cookies.get('frappe_csrf_token');
    if (token) {
      config.headers['X-Frappe-CSRF-Token'] = token;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const login = async (usr, pwd) => {
  return await api.post('/method/login', { usr, pwd });
};

export const logout = async () => {
  return await api.post('/method/logout');
};

export const getLoggedInUser = async () => {
  return await api.get('/method/frappe.auth.get_logged_user');
};

export const getEmployeeProfile = async (email) => {
  try {
    const res = await api.get(`/resource/Shift Employee?filters=[["email","=","${email}"]]&fields=["*"]`);
    if (res.data.data && res.data.data.length > 0) {
      return res.data.data[0];
    }
    return null;
  } catch (error) {
    return null;
  }
};

export default api;
