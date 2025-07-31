import apiClient from './apiClient';

// Get attendance for a specific class and date
export const getAttendanceByClassAndDate = async (classId, date) => {
  const response = await apiClient.get('/attendance', {
    params: { classId, date }
  });
  return response.data;
};

// Mark attendance for students
export const markAttendance = async (classId, date, attendanceData) => {
  const response = await apiClient.post('/attendance/mark', {
    classId,
    date,
    attendanceData
  });
  return response.data;
};

// Get attendance history for a class
export const getAttendanceHistory = async (classId, params = {}) => {
  const { startDate, endDate, limit = 30, offset = 0 } = params;
  const response = await apiClient.get(`/attendance/history/${classId}`, {
    params: { startDate, endDate, limit, offset }
  });
  return response.data;
};

// Get detailed attendance for a specific date
export const getDetailedAttendanceByDate = async (classId, date) => {
  const response = await apiClient.get('/attendance/detailed', {
    params: { classId, date }
  });
  return response.data;
};

// Get attendance statistics for a class
export const getAttendanceStats = async (classId, startDate = null, endDate = null) => {
  const response = await apiClient.get(`/attendance/stats/${classId}`, {
    params: { startDate, endDate }
  });
  return response.data;
};

// Get attendance by date range with modern UI support
export const getAttendanceByDateRange = async (classId, startDate = null, endDate = null) => {
  const response = await apiClient.get('/attendance/range', {
    params: { classId, startDate, endDate }
  });
  return response.data;
};

// Get all classes attendance summary for admin
export const getAllClassesAttendanceSummary = async (startDate = null, endDate = null) => {
  const response = await apiClient.get('/attendance/admin/summary', {
    params: { startDate, endDate }
  });
  return response.data;
};

// Get detailed attendance report for admin
export const getAdminAttendanceReport = async (startDate = null, endDate = null, classIds = null) => {
  const response = await apiClient.get('/attendance/admin/report', {
    params: { startDate, endDate, classIds }
  });
  return response.data;
};

// Delete attendance record
export const deleteAttendanceRecord = async (attendanceId) => {
  const response = await apiClient.delete(`/attendance/${attendanceId}`);
  return response.data;
};