import apiClient from "./apiClient";

// Get all students (with optional class filter)
export const getAllStudents = async (classId = null) => {
  const url = classId ? `/students?classId=${classId}` : "/students";
  const response = await apiClient.get(url);
  return response.data;
};

// Get student by ID
export const getStudentById = async (id) => {
  const response = await apiClient.get(`/students/${id}`);
  return response.data;
};

// Create new student
export const createStudent = async (data) => {
  const response = await apiClient.post("/students", data);
  return response.data;
};

// Update existing student
export const updateStudent = async (id, data) => {
  const response = await apiClient.put(`/students/${id}`, data);
  return response.data;
};

// Deactivate student (soft delete)
export const deleteStudent = async (id) => {
  const response = await apiClient.delete(`/students/${id}`);
  return response.data;
};

// Get available parents
export const getAvailableParents = async () => {
  const response = await apiClient.get("/students/parents");
  return response.data;
};

// Get students by class
export const getStudentsByClass = async (classId) => {
  const response = await apiClient.get(`/students/class/${classId}`);
  return response.data;
};
