import apiClient from './apiClient';

export const getAllSchools = async () => {
  try {
    const response = await apiClient.get('/api/schools');
    return response.data;
  } catch (error) {
    console.error('Error fetching schools:', error);
    throw error;
  }
};

export const getSchoolById = async (id) => {
  try {
    const response = await apiClient.get(`/api/schools/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching school:', error);
    throw error;
  }
};

export const createSchool = async (schoolData) => {
  try {
    const response = await apiClient.post('/api/schools', schoolData);
    return response.data;
  } catch (error) {
    console.error('Error creating school:', error);
    throw error;
  }
};

export const updateSchool = async (id, schoolData) => {
  try {
    const response = await apiClient.put(`/api/schools/${id}`, schoolData);
    return response.data;
  } catch (error) {
    console.error('Error updating school:', error);
    throw error;
  }
};

export const deleteSchool = async (id) => {
  try {
    const response = await apiClient.delete(`/api/schools/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting school:', error);
    throw error;
  }
};

export const getSchoolStats = async (id) => {
  try {
    const response = await apiClient.get(`/api/schools/${id}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching school stats:', error);
    throw error;
  }
};