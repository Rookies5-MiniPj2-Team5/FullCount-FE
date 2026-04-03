import api from './api';

export const getMeetupPosts = (params) =>
  api.get('/posts', { params: { boardType: 'MEETUP', ...params } });

export const getMeetupPost = (id) =>
  api.get(`/posts/${id}`);

export const createMeetupPost = (data) =>
  api.post('/posts', { ...data, boardType: 'MEETUP' });

export const deleteMeetupPost = (id) =>
  api.delete(`/posts/${id}`);

// Legacy meetup application endpoints kept for other screens.
export const applyMeetup = (postId, message) =>
  api.post(`/posts/${postId}/join`, { message });

export const getMyApplication = (postId) =>
  api.get(`/posts/${postId}/members`);

export const getApplications = (postId) =>
  api.get(`/posts/${postId}/members`);

// Mate-specific endpoints used by Meetup detail page.
export const applyMeetupMate = (postId, applyMessage) =>
  api.post(`/posts/${postId}/mate/join`, { applyMessage });

export const getMeetupMateMembers = (postId) =>
  api.get(`/posts/${postId}/mate/members`);

export const cancelApplication = (applicationId) =>
  api.delete(`/applications/${applicationId}`);

export const acceptApplication = (applicationId) =>
  api.patch(`/applications/${applicationId}/accept`);

export const rejectApplication = (applicationId) =>
  api.patch(`/applications/${applicationId}/reject`);
