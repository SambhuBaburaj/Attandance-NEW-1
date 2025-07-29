// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.3:5000'  // Development - use your computer's IP
  : 'http://localhost:5000';   // Production or web

export default {
  API_BASE_URL
};