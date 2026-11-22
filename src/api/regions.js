import { apiRequest } from './client.js';

export const getRegions = (options) => apiRequest('/api/regions', options);
