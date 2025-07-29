import { parentApi } from '../api/parentApi';

export const parentService = {
  // Get parent's children
  getMyChildren: async () => {
    try {
      return await parentApi.getMyChildren();
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  },

  // Get attendance for specific child
  getChildAttendance: async (studentId, startDate, endDate) => {
    try {
      return await parentApi.getChildAttendance(studentId, startDate, endDate);
    } catch (error) {
      console.error('Error fetching child attendance:', error);
      throw error;
    }
  },

  // Get attendance summary for all children
  getAttendanceSummary: async () => {
    try {
      return await parentApi.getAttendanceSummary();
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  },

  // Get today's attendance for all children
  getChildTodayAttendance: async () => {
    try {
      return await parentApi.getChildTodayAttendance();
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      return await parentApi.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Profile management
  getProfile: async () => {
    try {
      return await parentApi.getProfile();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      return await parentApi.updateProfile(profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Notifications
  getNotifications: async (limit = 20, offset = 0, unreadOnly = false) => {
    try {
      return await parentApi.getNotifications(limit, offset, unreadOnly);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      return await parentApi.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      return await parentApi.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Messages with teachers
  getMessages: async (limit = 20, offset = 0, studentId = null) => {
    try {
      return await parentApi.getMessages(limit, offset, studentId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  sendMessageToTeacher: async (studentId, subject, message) => {
    try {
      return await parentApi.sendMessageToTeacher(studentId, subject, message);
    } catch (error) {
      console.error('Error sending message to teacher:', error);
      throw error;
    }
  },

  // Attendance reports
  getAttendanceReport: async (studentId, month, year) => {
    try {
      return await parentApi.getAttendanceReport(studentId, month, year);
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      throw error;
    }
  }
};