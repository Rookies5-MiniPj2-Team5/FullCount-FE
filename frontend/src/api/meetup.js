import api from './api'

// 모집글 목록 조회
export const getMeetupPosts = (params) =>
  api.get('/posts', { params: { boardType: 'MEETUP', ...params } })

// 모집글 상세 조회
export const getMeetupPost = (id) =>
  api.get(`/posts/${id}`)

// 모집글 등록
export const createMeetupPost = (data) =>
  api.post('/posts', { ...data, boardType: 'MEETUP' })

// 모집글 삭제
export const deleteMeetupPost = (id) =>
  api.delete(`/posts/${id}`)

// 신청하기
export const applyMeetup = (postId, message) =>
  api.post(`/posts/${postId}/apply`, { message })

// 내 신청 상태 조회
export const getMyApplication = (postId) =>
  api.get(`/posts/${postId}/applications/me`)

// 신청자 목록 조회 (작성자 전용)
export const getApplications = (postId) =>
  api.get(`/posts/${postId}/applications`)

// 신청 취소
export const cancelApplication = (applicationId) =>
  api.delete(`/applications/${applicationId}`)

// 신청 수락
export const acceptApplication = (applicationId) =>
  api.patch(`/applications/${applicationId}/accept`)

// 신청 거절
export const rejectApplication = (applicationId) =>
  api.patch(`/applications/${applicationId}/reject`)
