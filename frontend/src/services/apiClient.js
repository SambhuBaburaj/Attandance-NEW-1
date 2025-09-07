import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use your computer's IP address for React Native development
// Replace with your actual IP address or use localhost for web development
const API_BASE_URL = __DEV__
  ? "http://localhost:3001/api" // Development - use your computer's IP
  : "http://localhost:3001/api"; // Production or web

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Store for auth handlers
let authHandlers = [];

// Function to add auth event handlers
export const addAuthHandler = (handler) => {
  authHandlers.push(handler);
};

// Function to remove auth event handlers
export const removeAuthHandler = (handler) => {
  authHandlers = authHandlers.filter(h => h !== handler);
};

// Function to notify auth handlers
const notifyAuthHandlers = (event) => {
  authHandlers.forEach(handler => {
    try {
      handler(event);
    } catch (error) {
      console.error('Auth handler error:', error);
    }
  });
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request timestamp for debugging
      config.metadata = { 
        startTime: Date.now(),
        url: config.url,
        method: config.method?.toUpperCase()
      };
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (__DEV__ && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(
        `✅ ${response.config.metadata.method} ${response.config.metadata.url} - ${response.status} (${duration}ms)`
      );
    }
    return response;
  },
  async (error) => {
    // Log errors in development
    if (__DEV__ && error.config?.metadata) {
      const duration = Date.now() - error.config.metadata.startTime;
      console.error(
        `❌ ${error.config.metadata.method} ${error.config.metadata.url} - ${error.response?.status || 'Network Error'} (${duration}ms)`,
        error.response?.data || error.message
      );
    }

    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expired or invalid
          console.log('Authentication failed - clearing tokens');
          await AsyncStorage.multiRemove(['token', 'user']);
          notifyAuthHandlers({ type: 'LOGOUT', reason: 'UNAUTHORIZED' });
          break;
          
        case 403:
          // Forbidden - insufficient permissions
          console.log('Access forbidden');
          break;
          
        case 404:
          // Not found
          console.log('Resource not found');
          break;
          
        case 422:
          // Validation error
          console.log('Validation error:', data);
          break;
          
        case 500:
          // Server error
          console.log('Server error');
          break;
          
        default:
          console.log(`API Error ${status}:`, data);
      }
      
      // Enhanced error object
      const enhancedError = {
        ...error,
        isApiError: true,
        statusCode: status,
        errorCode: data?.code,
        message: data?.error || data?.message || error.message,
        details: data?.details,
        timestamp: new Date().toISOString()
      };
      
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Network error
      const networkError = {
        ...error,
        isNetworkError: true,
        message: 'Network connection failed. Please check your internet connection.',
        timestamp: new Date().toISOString()
      };
      
      console.error('Network error:', networkError.message);
      return Promise.reject(networkError);
    } else {
      // Other error
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Utility function to check if error is network related
export const isNetworkError = (error) => {
  return error.isNetworkError || error.code === 'NETWORK_ERROR' || !error.response;
};

// Utility function to check if error is authentication related
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.errorCode === 'TOKEN_EXPIRED';
};

// Utility function to get user-friendly error message
export const getErrorMessage = (error) => {
  if (error.isNetworkError) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  if (error.response?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.response?.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Retry function for failed requests
export const retryRequest = async (originalRequest, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await apiClient(originalRequest);
      return response;
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Don't retry auth errors or client errors (4xx except 408, 429)
      if (error.response?.status === 401 || 
          error.response?.status === 403 || 
          (error.response?.status >= 400 && 
           error.response?.status < 500 && 
           error.response?.status !== 408 && 
           error.response?.status !== 429)) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default apiClient;
