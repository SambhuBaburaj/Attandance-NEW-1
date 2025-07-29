import apiClient from './apiClient';

export const getAttendanceReport = async (params) => {
  try {
    const response = await apiClient.get('/api/reports/attendance', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    throw error;
  }
};

export const getClassReport = async (params) => {
  try {
    const response = await apiClient.get('/api/reports/class', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching class report:', error);
    throw error;
  }
};

export const getStudentReport = async (params) => {
  try {
    const response = await apiClient.get('/api/reports/student', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching student report:', error);
    throw error;
  }
};

export const getTeacherReport = async (params) => {
  try {
    const response = await apiClient.get('/api/reports/teacher', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher report:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/reports/dashboard-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getMonthlyAttendanceReport = async (params) => {
  try {
    const response = await apiClient.get('/api/reports/monthly-attendance', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly attendance report:', error);
    throw error;
  }
};

export const getWeeklyAttendanceReport = async (params) => {
  try {
    const response = await apiClient.get('/api/reports/weekly-attendance', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly attendance report:', error);
    throw error;
  }
};

export const exportReport = async (reportType, format, params) => {
  try {
    const response = await apiClient.post('/api/reports/export', {
      reportType,
      format, // 'pdf', 'excel', 'csv'
      ...params
    }, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

// Utility function to get all classes (reused from class service)
export const getAllClasses = async () => {
  try {
    const response = await apiClient.get('/api/classes');
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};