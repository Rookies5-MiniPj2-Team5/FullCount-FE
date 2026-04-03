import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TeamBadge } from '../components/TeamComponents'
import { StatusBadge } from '../components/StatusBadge'
import ApplyModal from '../components/ApplyModal'
import ApplicationList from '../components/ApplicationList'
import MyApplicationStatus from '../components/MyApplicationStatus'
import api from '../api/api' 
import {
    getMeetupPost,
    getApplications,
    getMyApplication,
    applyMeetup,
    cancelApplication,
    acceptApplication,
    rejectApplication,
} from '../api/meetup'
import { createOrGetMeetupDmRoom, createOrGetDmByNickname } from '../api/chat'

const TEAMS = [
    { id: 'LG', name: 'LG 트윈스' }, { id: 'DU', name: '두산 베어스' },
    { id: 'SSG', name: 'SSG 랜더스' }, { id: 'KIA', name: 'KIA 타이거즈' },
    { id: 'SA', name: '삼성 라이온즈' }, { id: 'LO', name: '롯데 자이언츠' },
    { id: 'HH', name: '한화 이글스' }, { id: 'KT', name: 'KT 위즈' },
    { id: 'NC', name: 'NC 다이노스' }, { id: 'WO', name: '키움 히어로즈' },
];

const STADIUMS = {
    LG: '잠실야구장', DU: '잠실야구장', SSG: '인천 SSG 랜더스필드', KIA: '광주-기아 챔피언스 필드',
    SA: '대구 삼성 라이온즈 파크', LO: '사직야구장', HH: '한화생명 이글스 파크', KT: '수원 KT 위즈 파크',
    NC: '창원 NC 파크', WO: '고척 스카이돔',
    1: '잠실야구장', 2: '잠실야구장', 3: '인천 SSG 랜더스필드', 4: '광주-기아 챔피언스 필드',
    5: '대구 삼성 라이온즈 파크', 6: '사직야구장', 7: '한화생명 이글스 파크', 8: '수원 KT 위즈 파크',
    9: '창원 NC 파크', 10: '고척 스카이돔'
};

const ID_TO_TEAM_NAME = {
    1: "LG", 2: "두산", 3: "SSG", 4: "KIA", 5: "삼성",
    6: "롯데", 7: "한화", 8: "KT", 9: "NC", 10: "키움"
};

const TEAM_NAME_TO_ID = {
    "LG": "LG", "두산": "DU", "SSG": "SSG", "KIA": "KIA", "삼성": "SA",
    "롯데": "LO", "한화": "HH", "KT": "KT", "NC": "NC", "키움": "WO"
};

const STADIUM_OPTIONS = [
  "잠실야구장", "고척 스카이돔", "인천 SSG 랜더스필드", "수원 KT 위즈 파크", 
  "광주-기아 챔피언스 필드", "창원 NC 파크", "대구 삼성 라이온즈 파크", 
  "사직야구장", "한화생명 이글스 파크"
];

const getNormalizedTeamName = (id, name) => {
    if (id && ID_TO_TEAM_NAME[id]) return ID_TO_TEAM_NAME[id];
    if (typeof name === 'string') {
        if (name.includes('LG')) return 'LG';
        if (name.includes('두산') || name === 'DU') return '두산';
        if (name.includes('SSG')) return 'SSG';
        if (name.includes('KIA') || name.includes('기아')) return 'KIA';
        if (name.includes('삼성') || name === 'SA') return '삼성';
        if (name.includes('롯데') || name === 'LO') return '롯데';
        if (name.includes('한화') || name === 'HH') return '한화';
        if (name.includes('KT')) return 'KT';
        if (name.includes('NC')) return 'NC';
        if (name.includes('키움') || name === 'WO') return '키움';
    }
    return "미정";
};

export default function MeetupDetailPage({ postId, onBack }) {
    const id = postId
    const { user } = useAuth()

    const [post, setPost] = useState(null)
    const [applications, setApplications] = useState([])
    const [myApplication, setMyApplication] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
    const [tab, setTab] = useState('info')


    const fetchPost = async () => {
        try {
            setLoading(true)
            const res = await getMeetupPost(id)

            alert('게시글을 불러오지 못했습니다.')
            onBack()
        } finally {
            setLoading(false)
        }
    }

    const fetchApplications = async () => {
        try {
            const res = await getApplications(id)

        }
    }

    const fetchMyApplication = async () => {
        try {
            const res = await getMyApplication(id)
            setMyApplication(res.data?.data || res.data)
        } catch {
            setMyApplication(null)
        }
    }

    useEffect(() => {
        fetchPost()
        if (user) fetchMyApplication()
    }, [id, user])

    useEffect(() => {

    }, [post, isAuthor])

    const handleEditClick = (postData) => {
        const target = (postData && postData.title) ? postData : post;
        if(!target) return;

        const homeName = getNormalizedTeamName(target.homeTeamId, target.homeTeamName)
        const awayName = getNormalizedTeamName(target.awayTeamId, target.awayTeamName)
        
        setEditForm({ 
            title: target.title || '', 
            content: target.content || '',
            homeTeamId: TEAM_NAME_TO_ID[homeName] || '',
            awayTeamId: TEAM_NAME_TO_ID[awayName] || '',
            matchDate: target.matchDate || '',
            maxParticipants: target.maxParticipants || 2,
            stadium: target.stadium || STADIUMS[TEAM_NAME_TO_ID[homeName]] || '' 
        })
        setIsEditMode(true)
    }

                </div>
              </div>
            )}

                {tab === 'info' && (
                    <>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 8 }}>📋 상세 설명</div>
                            {isEditMode ? (
                                <textarea value={editForm.content} onChange={(e) => setEditForm({...editForm, content: e.target.value})} style={{ width: '100%', height: '150px', padding: '10px', fontSize: 13, color: '#333', lineHeight: 1.7, borderRadius: '8px', border: '1px solid #ddd', resize: 'none', boxSizing: 'border-box' }} />
                            ) : (
                                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.content}</div>
                            )}
                        </div>

                        {!isEditMode && (
                            <>
                                <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #eee' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 12 }}>🏟️ 경기 정보</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        {[ ['홈팀', homeTeam], ['원정팀', awayTeam], ['경기장', post.stadium || '미정'], ['날짜', post.matchDate] ].map(([label, val]) => (
                                            <div key={label} style={{ background: '#f9f9f9', borderRadius: 10, padding: 12 }}>
                                                <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 4 }}>{label}</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>

                    </>
                )}
              </div>
            )}


