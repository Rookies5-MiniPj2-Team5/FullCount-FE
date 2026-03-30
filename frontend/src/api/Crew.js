import api from './api'

// 크루 목록 조회
export const getCrews = (params) =>
  api.get('/crews', { params })

// 크루 상세 조회
export const getCrew = (id) =>
  api.get(`/crews/${id}`)

// 크루 생성
export const createCrew = (data) =>
  api.post('/crews', data)

// 크루 수정
export const updateCrew = (id, data) =>
  api.put(`/crews/${id}`, data)

// 크루 삭제
export const deleteCrew = (id) =>
  api.delete(`/crews/${id}`)

// 크루 가입 신청
export const joinCrew = (id) =>
  api.post(`/crews/${id}/join`)

// 크루 탈퇴
export const leaveCrew = (id) =>
  api.delete(`/crews/${id}/leave`)

// 내 크루 목록
export const getMyCrews = () =>
  api.get('/users/me/crews')