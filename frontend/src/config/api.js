// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.3:3001'  // Development - use your computer's IP
  : 'https://attandance-new-1.onrender.com';   // Production backend

export default {
  API_BASE_URL
};