import apiClient from './apiClient';

export const getAllTeachers = async () => {
  try {
    const response = await apiClient.get('/api/teachers');
    return response.data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
};

export const getTeacherById = async (id) => {
  try {
    const response = await apiClient.get(`/api/teachers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher:', error);
    throw error;
  }
};

export const createTeacher = async (teacherData) => {
  try {
    const response = await apiClient.post('/api/teachers', teacherData);
    return response.data;
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
};

export const updateTeacher = async (id, teacherData) => {
  try {
    const response = await apiClient.put(`/api/teachers/${id}`, teacherData);
    return response.data;
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
};

export const deleteTeacher = async (id) => {
  try {
    const response = await apiClient.delete(`/api/teachers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
};

export const getTeacherClasses = async (id) => {
  try {
    const response = await apiClient.get(`/api/teachers/${id}/classes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    throw error;
  }
};

export const assignTeacherToClass = async (teacherId, classId) => {
  try {
    const response = await apiClient.post(`/api/teachers/${teacherId}/assign-class`, {
      classId
    });
    return response.data;
  } catch (error) {
    console.error('Error assigning teacher to class:', error);
    throw error;
  }
};

export const unassignTeacherFromClass = async (teacherId, classId) => {
  try {
    const response = await apiClient.post(`/api/teachers/${teacherId}/unassign-class`, {
      classId
    });
    return response.data;
  } catch (error) {
    console.error('Error unassigning teacher from class:', error);
    throw error;
  }
};