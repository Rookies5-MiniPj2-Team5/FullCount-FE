import { useState, useMemo, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import api from '../api/api';

const TEAM_COLORS = {
    "두산": "#1a1748", "LG": "#C8102E", "SSG": "#CE0E2D", "키움": "#820024",
    "KT": "#1b1a1a", "삼성": "#074CA1", "한화": "#F37321", "NC": "#1D467A",
    "롯데": "#002561", "KIA": "#EA0029"
};

const TEAM_LOGOS = {
    "두산": "/두산.png", "LG": "/LG.png", "SSG": "/SK.png", "키움": "/키움.png",
    "KT": "/KT.png", "삼성": "/SS.png", "한화": "/HH.png", "NC": "/NC.png",
    "롯데": "/롯데.png", "KIA": "/기아.png"
};

const RESULT_COLORS = { WIN: '#2ecc71', LOSE: '#e74c3c', TIE: '#f39c12' };
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ✅ 팀원 코드 채택 — 서버 전송용 File 객체 반환
async function getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Canvas is empty')); return; }
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            resolve({ file, previewUrl: URL.createObjectURL(blob) });
        }, 'image/jpeg');
    });
}

export default function AttendanceCalendar({ onBack, user }) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
    const [viewMode, setViewMode] = useState('month');

    const [attendance, setAttendance] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // ✅ 팀원 코드 채택 — DatePicker 모달 state
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [tempYear, setTempYear] = useState(currentYear);

    const [selectedDate, setSelectedDate] = useState('');
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);
    const [recordForm, setRecordForm] = useState({ result: 'WIN', imgFile: null, memo: '' });

    const myTeamColor = TEAM_COLORS[user?.teamShortName] || "#e94560";
    const teamLogo = TEAM_LOGOS[user?.teamShortName];
    const teamDisplayName = user?.teamName || user?.teamShortName || "나의";

    // ✅ 전체 통계
    const totalStats = useMemo(() => {
        const total = attendance.length;
        const wins = attendance.filter(a => a.result === 'WIN').length;
        const loses = attendance.filter(a => a.result === 'LOSE').length;
        const ties = attendance.filter(a => a.result === 'TIE').length;
        const validGames = wins + loses;
        const rate = validGames > 0 ? Math.round((wins / validGames) * 100) : null;
        return { total, wins, loses, ties, rate };
    }, [attendance]);

    // ✅ attendanceMap 최적화
    const attendanceMap = useMemo(() => {
        return new Map(attendance.map(a => [a.date, a]));
    }, [attendance]);

    const calendarData = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        return [...Array(firstDayOfMonth).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    }, [currentYear, currentMonth]);

    // ✅ 연간 뷰용 월별 통계
    const yearlyStats = useMemo(() => {
        return MONTH_NAMES.map((_, idx) => {
            const month = String(idx + 1).padStart(2, '0');
            const monthRecords = attendance.filter(a => a.date.startsWith(`${currentYear}-${month}`));
            const wins = monthRecords.filter(a => a.result === 'WIN').length;
            const loses = monthRecords.filter(a => a.result === 'LOSE').length;
            const validGames = wins + loses;
            const rate = validGames > 0 ? Math.round((wins / validGames) * 100) : null;
            return { total: monthRecords.length, wins, loses, rate };
        });
    }, [attendance, currentYear]);

    useEffect(() => {
        fetchAttendances();
    }, []);

    // ✅ 팀원 코드 채택 — 실제 API 연동
    const fetchAttendances = async () => {
        try {
            const response = await api.get('/attendances');
            const attendanceList = response.data.data || [];
            const formattedData = attendanceList.map(item => {
                let parsedDate = item.date;
                if (Array.isArray(item.date)) {
                    const [yyyy, mm, dd] = item.date;
                    parsedDate = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
                }
                const baseUrl = api.defaults.baseURL
                    ? api.defaults.baseURL.replace('/api', '')
                    : 'http://localhost:8080';
                const fullImageUrl = item.imageUrl ? `${baseUrl}${item.imageUrl}` : null;
                return {
                    id: item.id,
                    date: parsedDate,
                    result: item.result,
                    imgUrl: fullImageUrl,
                    memo: item.memo || ''
                };
            });
            setAttendance(formattedData);
        } catch (error) {
            console.error("직관 기록 불러오기 실패:", error);
        }
    };

    const onSelectFile = (e) => {
        if (e.target.files?.[0]) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.onload = () => setImgSrc(reader.result.toString());
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, 2 / 3, width, height), width, height));
    };

    // ✅ 팀원 코드 채택 — FormData로 서버 전송 + 메모 추가
    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('date', selectedDate);
            formData.append('result', recordForm.result);
            formData.append('memo', recordForm.memo || '');

            if (imgRef.current && completedCrop) {
                const { file } = await getCroppedImg(imgRef.current, completedCrop, 'cropped.jpg');
                formData.append('image', file);
            }

            await api.post('/attendances', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await fetchAttendances();
            closeModal();
        } catch (error) {
            console.error("저장 실패:", error);
            alert('기록 저장에 실패했습니다.');
        }
    };

    // ✅ 팀원 코드 채택 — 실제 API 삭제
    const handleDelete = async () => {
        const record = attendanceMap.get(selectedDate);
        if (!record?.id) return;
        if (!window.confirm('기록을 삭제하시겠습니까?')) return;
        try {
            await api.delete(`/attendances/${record.id}`);
            await fetchAttendances();
            closeModal();
        } catch (error) {
            console.error("삭제 실패:", error);
            alert("삭제에 실패했습니다.");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setImgSrc('');
        setRecordForm({ result: 'WIN', imgFile: null, memo: '' });
    };

    const handleDateClick = (dateStr) => {
        setSelectedDate(dateStr);
        const rec = attendanceMap.get(dateStr);
        setRecordForm(rec
            ? { result: rec.result, imgFile: null, memo: rec.memo || '' }
            : { result: 'WIN', imgFile: null, memo: '' }
        );
        setIsModalOpen(true);
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) { setCurrentYear(y => y - 1); setCurrentMonth(12); }
        else setCurrentMonth(m => m - 1);
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) { setCurrentYear(y => y + 1); setCurrentMonth(1); }
        else setCurrentMonth(m => m + 1);
    };

    const handleMonthClick = (monthIdx) => {
        setCurrentMonth(monthIdx + 1);
        setViewMode('month');
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>

            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 12, borderBottom: `2px solid ${myTeamColor}` }}>
                <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
                <h2 style={{ fontWeight: 800, fontSize: '18px', margin: 0, color: myTeamColor }}>{teamDisplayName} 직관 아카이브</h2>
                <div style={{ width: 24 }} />
            </div>

            {/* 통계 배너 */}
            <div style={{ background: `linear-gradient(135deg, ${myTeamColor}15, ${myTeamColor}30)`, border: `1px solid ${myTeamColor}40`, borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>총 직관</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: myTeamColor }}>
                        {totalStats.total}<span style={{ fontSize: 12, fontWeight: 400 }}>경기</span>
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>승 / 무 / 패</div>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>
                        <span style={{ color: '#2ecc71' }}>{totalStats.wins}</span>
                        <span style={{ color: '#ccc', fontSize: 14 }}> / </span>
                        <span style={{ color: '#f39c12' }}>{totalStats.ties}</span>
                        <span style={{ color: '#ccc', fontSize: 14 }}> / </span>
                        <span style={{ color: '#e74c3c' }}>{totalStats.loses}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>직관 승률</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: myTeamColor }}>
                        {totalStats.rate !== null ? `${totalStats.rate}%` : '-'}
                    </div>
                </div>
            </div>

            {/* 뷰 전환 버튼 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['month', 'year'].map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: viewMode === mode ? myTeamColor : '#f0f0f0', color: viewMode === mode ? '#fff' : '#888' }}>
                        {mode === 'month' ? '📅 월간' : '📆 연간'}
                    </button>
                ))}
            </div>

            {/* 월간 뷰 */}
            {viewMode === 'month' && (
                <>
                    {/* ✅ 팀원 코드 채택 — DatePicker 버튼 포함한 날짜 컨트롤러 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
                        <button onClick={handlePrevMonth} style={{ border: 'none', background: 'none', color: myTeamColor, fontSize: 18, cursor: 'pointer', padding: '10px' }}>◀</button>
                        <button
                            onClick={() => { setTempYear(currentYear); setIsDatePickerOpen(true); }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px 15px', borderRadius: '10px' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span style={{ fontWeight: 800, fontSize: 20, color: '#333' }}>
                                {currentYear}. {String(currentMonth).padStart(2, '0')}
                            </span>
                            <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>클릭하여 날짜 변경</div>
                        </button>
                        <button onClick={handleNextMonth} style={{ border: 'none', background: 'none', color: myTeamColor, fontSize: 18, cursor: 'pointer', padding: '10px' }}>▶</button>
                    </div>

                    {/* 요일 헤더 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 10 }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                            <span key={d} style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#e94560' : i === 6 ? '#3498db' : '#999' }}>{d}</span>
                        ))}
                    </div>

                    {/* 달력 그리드 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                        {calendarData.map((day, i) => {
                            const dateStr = day ? `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                            const rec = dateStr ? attendanceMap.get(dateStr) : null;
                            const isToday = dateStr === todayStr;

                            return (
                                <div key={i} onClick={() => dateStr && handleDateClick(dateStr)}
                                    style={{ display: 'flex', flexDirection: 'column', cursor: day ? 'pointer' : 'default', minHeight: '140px', visibility: day === null ? 'hidden' : 'visible' }}>
                                    <span style={{ fontSize: 10, marginBottom: 4, height: '14px', fontWeight: isToday ? 900 : 400, color: isToday ? '#e94560' : '#bbb' }}>
                                        {day}
                                    </span>
                                    <div style={{ width: '100%', aspectRatio: '2/3', border: isToday ? `2px solid #e94560` : '1px solid #eee', borderRadius: 4, overflow: 'hidden', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: rec ? 'flex-start' : 'center' }}>
                                        {rec ? (
                                            <>
                                                <div style={{ fontSize: 10, fontWeight: 900, width: '100%', textAlign: 'center', color: RESULT_COLORS[rec.result], padding: '2px 0', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                                                    {rec.result}
                                                </div>
                                                <div style={{ flex: 1, width: '90%', margin: '4px auto', backgroundImage: rec.imgUrl ? `url(${rec.imgUrl})` : 'none', backgroundColor: rec.imgUrl ? 'transparent' : `${myTeamColor}10`, backgroundSize: 'cover', backgroundPosition: 'center', border: '2px dotted #ddd', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {!rec.imgUrl && teamLogo && (
                                                        <img src={teamLogo} alt="팀 로고" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: 18, color: '#ddd', lineHeight: 1 }}>+</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* 연간 뷰 */}
            {viewMode === 'year' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {MONTH_NAMES.map((monthName, idx) => {
                        const stats = yearlyStats[idx];
                        const isCurrentMonth = idx + 1 === currentMonth;
                        return (
                            <div key={idx} onClick={() => handleMonthClick(idx)}
                                style={{ padding: 14, borderRadius: 12, cursor: 'pointer', border: isCurrentMonth ? `2px solid ${myTeamColor}` : '1px solid #eee', background: isCurrentMonth ? `${myTeamColor}10` : '#fafafa', textAlign: 'center' }}>
                                <div style={{ fontWeight: 800, fontSize: 15, color: isCurrentMonth ? myTeamColor : '#333', marginBottom: 8 }}>{monthName}</div>
                                {stats.total > 0 ? (
                                    <>
                                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{stats.total}경기</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                                            <span style={{ color: '#2ecc71' }}>{stats.wins}승</span>
                                            <span style={{ color: '#ccc' }}> / </span>
                                            <span style={{ color: '#e74c3c' }}>{stats.loses}패</span>
                                        </div>
                                        <div style={{ height: 4, borderRadius: 2, background: '#eee', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: 2, width: `${stats.rate ?? 0}%`, background: myTeamColor }} />
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: myTeamColor, marginTop: 4 }}>
                                            {stats.rate !== null ? `${stats.rate}%` : '-'}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: 11, color: '#ccc' }}>기록 없음</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ✅ 팀원 코드 채택 — DatePicker 모달 */}
            {isDatePickerOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', width: '90%', maxWidth: '320px', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginBottom: 20, fontSize: 18, textAlign: 'center', fontWeight: 800, color: '#333' }}>달력 이동</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 24, backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '12px' }}>
                            <button onClick={() => setTempYear(y => y - 1)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: myTeamColor }}>◀</button>
                            <span style={{ fontSize: 20, fontWeight: 800 }}>{tempYear}년</span>
                            <button onClick={() => setTempYear(y => y + 1)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: myTeamColor }}>▶</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                                const isSelected = currentYear === tempYear && currentMonth === m;
                                return (
                                    <button key={m} onClick={() => { setCurrentYear(tempYear); setCurrentMonth(m); setIsDatePickerOpen(false); }}
                                        style={{ padding: '12px 0', borderRadius: '10px', border: isSelected ? `2px solid ${myTeamColor}` : '1px solid #ddd', background: isSelected ? myTeamColor : '#fff', color: isSelected ? '#fff' : '#444', fontWeight: isSelected ? 800 : 600, fontSize: '14px', cursor: 'pointer' }}>
                                        {m}월
                                    </button>
                                );
                            })}
                        </div>
                        <button onClick={() => setIsDatePickerOpen(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>✕</button>
                    </div>
                </div>
            )}

            {/* 기록 모달 */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto' }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 20, width: '90%', maxWidth: 400, position: 'relative' }}>
                        <h3 style={{ marginBottom: 20, fontSize: 16 }}>{selectedDate} 기록</h3>

                        {/* TIE 포함 결과 버튼 */}
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>경기 결과</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {['WIN', 'TIE', 'LOSE'].map(r => (
                                    <button key={r} onClick={() => setRecordForm({ ...recordForm, result: r })}
                                        style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', backgroundColor: recordForm.result === r ? RESULT_COLORS[r] : '#eee', color: recordForm.result === r ? '#fff' : '#888' }}>{r}</button>
                                ))}
                            </div>
                        </div>

                        {/* 사진 업로드 */}
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>우표 사진 (2:3 비율 크롭)</p>
                            <input type="file" accept="image/*" onChange={onSelectFile} style={{ fontSize: 12, marginBottom: 10, width: '100%' }} />
                            {imgSrc && (
                                <div style={{ textAlign: 'center', background: '#f5f5f5', padding: 10, borderRadius: 8 }}>
                                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={2 / 3}>
                                        <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} style={{ maxWidth: '100%', maxHeight: 300 }} />
                                    </ReactCrop>
                                </div>
                            )}
                            {!imgSrc && attendanceMap.get(selectedDate)?.imgUrl && (
                                <div style={{ marginTop: 8, textAlign: 'center' }}>
                                    <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>현재 저장된 사진</p>
                                    <img src={attendanceMap.get(selectedDate).imgUrl} alt="저장된 사진"
                                        style={{ width: '40%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, border: `2px solid ${myTeamColor}`, display: 'block', margin: '0 auto' }} />
                                </div>
                            )}
                        </div>

                        {/* 메모 */}
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                                📝 메모 <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>(사진을 눌러야만 볼 수 있어요)</span>
                            </p>
                            <textarea value={recordForm.memo} onChange={(e) => setRecordForm({ ...recordForm, memo: e.target.value })}
                                placeholder="오늘 직관 한 줄 메모를 남겨보세요 ⚾"
                                style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 10, border: '1px solid #eee', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6, color: '#333' }} />
                        </div>

                        {/* 저장/삭제 */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            {attendanceMap.get(selectedDate) && (
                                <button onClick={handleDelete} style={{ flex: 1, padding: 14, background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                            )}
                            <button onClick={handleSave} style={{ flex: 1, padding: 14, background: myTeamColor, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>저장</button>
                        </div>

                        <button onClick={closeModal} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa' }}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
}
