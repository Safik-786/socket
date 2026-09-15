import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const fetchMessages = async (room) => {
  const { data } = await api.get(`/chat/${room}/messages`);
  return data;
};

export const loginUser = async (username) => {
  const { data } = await api.post('/users/login', { username });
  return data;
};

export const getAllUsers = async (excludeUserId) => {
  const { data } = await api.get(`/users?exclude=${excludeUserId}`);
  return data;
};

export const createOrGetDirectChat = async (userId, targetUserId) => {
  const { data } = await api.post('/chat/direct', { userId, targetUserId });
  return data;
};

export const fetchUserGroups = async (userId) => {
  const { data } = await api.get(`/groups/user/${userId}`);
  return data;
};

export const createGroup = async (name, adminId) => {
  const { data } = await api.post('/groups', { name, adminId });
  return data;
};

export const addMember = async (groupId, username, adminId) => {
  const { data } = await api.post(`/groups/${groupId}/members`, { username, adminId });
  return data;
};

export const removeMember = async (groupId, userId, adminId) => {
  const { data } = await api.delete(`/groups/${groupId}/members/${userId}`, { data: { adminId } });
  return data;
};

export const updateGroup = async (groupId, name, adminId) => {
  const { data } = await api.put(`/groups/${groupId}`, { name, adminId });
  return data;
};

export const deleteGroup = async (groupId, adminId) => {
  const { data } = await api.delete(`/groups/${groupId}`, { data: { adminId } });
  return data;
};

export default api;
