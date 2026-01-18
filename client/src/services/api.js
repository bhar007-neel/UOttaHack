import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const priceService = {
  getCurrentPrices: () => api.get('/prices/current'),
  getCheapestStores: () => api.get('/prices/cheapest'),
  getPriceHistory: (productName, days = 30) =>
    api.get(`/prices/history/${productName}`, { params: { days } }),
  getStoreProducts: (storeName) => api.get(`/prices/store/${storeName}`),
};

export const alertService = {
  getAlerts: (limit = 20) => api.get('/alerts', { params: { limit } }),
  getUnreadCount: () => api.get('/alerts/unread'),
  markAsRead: (alertId) => api.put(`/alerts/${alertId}/read`),
  dismissAlert: (alertId) => api.delete(`/alerts/${alertId}`),
};

export const reportService = {
  getWeeklyInflation: () => api.get('/reports/weekly-inflation'),
  getStoreComparison: (product, days = 7) =>
    api.get('/reports/store-comparison', { params: { product, days } }),
  getMonthlyTrend: () => api.get('/reports/monthly-trend'),
};

export const adminService = {
  // Products
  getProducts: () => api.get('/admin/products'),
  addProduct: (name, unit = 'item') => api.post('/admin/products', { name, unit }),
  updateProduct: (id, name, unit = 'item') => api.put(`/admin/products/${id}`, { name, unit }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Stores
  getStores: () => api.get('/admin/stores'),
  addStore: (name, url = '') => api.post('/admin/stores', { name, url }),
  updateStore: (id, name, url = '') => api.put(`/admin/stores/${id}`, { name, url }),
  deleteStore: (id) => api.delete(`/admin/stores/${id}`),
};

export const scraperService = {
  getStatus: () => api.get('/scraper/status'),
  startScraping: (productId) => api.post(`/scraper/start?productId=${productId}`),
};

export default api;
