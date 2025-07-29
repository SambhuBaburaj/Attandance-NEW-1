import apiClient from "./apiClient";

// Get all classes
export const getAllClasses = async () => {
  const response = await apiClient.get("/classes");
  return response.data;
};

// Get class by ID
export const getClassById = async (id) => {
  const response = await apiClient.get(`/classes/${id}`);
  return response.data;
};

// Create new class
export const createClass = async (data) => {
  console.log("Creating a new class with data:", data);
  const response = await apiClient.post("/classes", data);
  return response.data;
};

// Update existing class
export const updateClass = async (id, data) => {
  const response = await apiClient.put(`/classes/${id}`, data);
  return response.data;
};

// Delete class
export const deleteClass = async (id) => {
  const response = await apiClient.delete(`/classes/${id}`);
  return response.data;
};

// Get available teachers
export const getAvailableTeachers = async () => {
  const response = await apiClient.get("/classes/teachers");
  return response.data;
};
