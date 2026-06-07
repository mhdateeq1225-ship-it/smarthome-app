/* ================================================================
   API Service — Handles all backend communication
================================================================ */

const API = {
  BASE_URL: 'http://localhost:3000/api',
  token: localStorage.getItem('eiq_token') || null,

  // Set token after login
  setToken(token) {
    this.token = token;
    localStorage.setItem('eiq_token', token);
  },

  // Clear token on logout
  clearToken() {
    this.token = null;
    localStorage.removeItem('eiq_token');
  },

  // Helper to make requests with auth header
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;

    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // ========== AUTH ==========
  auth: {
    signup: (username, email, password, fullName) =>
      API.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, fullName })
      }),

    login: (username, password) =>
      API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),

    verify: () => API.request('/auth/verify'),

    logout: () => API.request('/auth/logout', { method: 'POST' })
  },

  // ========== DEVICES ==========
  devices: {
    getAll: () => API.request('/devices'),

    add: (name, category, location, brand, wattage) =>
      API.request('/devices', {
        method: 'POST',
        body: JSON.stringify({ name, category, location, brand, wattage })
      }),

    delete: (deviceId) =>
      API.request(`/devices/${deviceId}`, { method: 'DELETE' })
  }
};
