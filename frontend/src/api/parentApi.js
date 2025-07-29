import apiClient from '../services/apiClient';

export const parentApi = {
  // Get parent's children
  getMyChildren: async () => {
    try {
      const response = await apiClient.get('/parents/my-children');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch children');
    }
  },

  // Get attendance for specific child
  getChildAttendance: async (studentId, startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get(`/parents/child-attendance/${studentId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch attendance');
    }
  },

  // Get attendance summary for all children
  getAttendanceSummary: async () => {
    try {
      const response = await apiClient.get('/parents/attendance-summary');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch attendance summary');
    }
  },

  // Get today's attendance for all children
  getChildTodayAttendance: async () => {
    try {
      const response = await apiClient.get('/parents/today-attendance');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch today attendance');
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to change password');
    }
  },

  // Profile management
  getProfile: async () => {
    try {
      const response = await apiClient.get('/parents/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch profile');
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/parents/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  },

  // Notifications
  getNotifications: async (limit = 20, offset = 0, unreadOnly = false) => {
    try {
      const params = { limit, offset };
      if (unreadOnly) params.unreadOnly = 'true';
      
      const response = await apiClient.get('/parents/notifications', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch notifications');
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(`/parents/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to mark notification as read');
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await apiClient.put('/parents/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to mark all notifications as read');
    }
  },

  // Messages with teachers
  getMessages: async (limit = 20, offset = 0, studentId = null) => {
    try {
      const params = { limit, offset };
      if (studentId) params.studentId = studentId;
      
      const response = await apiClient.get('/parents/messages', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch messages');
    }
  },

  sendMessageToTeacher: async (studentId, subject, message) => {
    try {
      const response = await apiClient.post('/parents/messages', {
        studentId,
        subject,
        message
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  },

  // Attendance reports
  getAttendanceReport: async (studentId, month, year) => {
    try {
      const response = await apiClient.get('/parents/attendance-report', {
        params: { studentId, month, year }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch attendance report');
    }
  }
};