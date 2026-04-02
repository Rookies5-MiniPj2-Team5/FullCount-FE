import { useState, useMemo, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import api from '../api/api';

const TEAM_COLORS = {
    "두산": "#1a1748", "LG": "#C8102E", "SSG": "#CE0E2D", "키움": "#820024",
    "KT": "#1b1a1a", "삼성": "#074CA1", "한화": "#F37321", "NC": "#1D467A",
    "롯데": "#002561", "KIA": "#EA0029"
};

async function getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0, 0, crop.width, crop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            resolve({ file, previewUrl: URL.createObjectURL(blob) });
        }, 'image/jpeg');
    });
}

export default function AttendanceCalendar({ onBack, user }) {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

    const [attendance, setAttendance] = useState([]);
    
    // 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // 🌟 날짜 선택기 모달 상태 추가
    const [tempYear, setTempYear] = useState(currentYear); // 🌟 날짜 선택기용 임시 연도

    const [selectedDate, setSelectedDate] = useState('');

    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);

    const [recordForm, setRecordForm] = useState({ result: 'WIN', imgFile: null });

    const myTeamColor = TEAM_COLORS[user?.teamShortName] || "#e94560";
    const teamDisplayName = user?.teamName || user?.teamShortName || "나의";

    const calendarData = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        return [...Array(firstDayOfMonth).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    }, [currentYear, currentMonth]);

    useEffect(() => {
        fetchAttendances();
    }, []);

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
                
                const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:8080';
                const fullImageUrl = item.imageUrl ? `${baseUrl}${item.imageUrl}` : null;

                return {
                    id: item.id,
                    date: parsedDate,
                    result: item.result,
                    imgUrl: fullImageUrl
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
        const aspect = 2 / 3;
        setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, aspect, width, height), width, height));
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('date', selectedDate); 
            formData.append('result', recordForm.result);

            if (imgRef.current && completedCrop) {
                const { file } = await getCroppedImg(imgRef.current, completedCrop, 'cropped.jpg');
                formData.append('image', file); 
            }

            await api.post('/attendances', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('기록이 저장되었습니다.');
            fetchAttendances(); 
            closeModal();
        } catch (error) {
            console.error("저장 실패:", error);
            alert('기록 저장에 실패했습니다.');
        }
    };

    const handleDelete = async () => {
        const record = attendance.find(a => a.date === selectedDate);
        if (!record || !record.id) return;

        if (window.confirm('기록을 삭제하시겠습니까?')) {
            try {
                await api.delete(`/attendances/${record.id}`);
                alert('삭제되었습니다.');
                fetchAttendances(); 
                closeModal();
            } catch (error) {
                console.error("삭제 실패:", error);
                alert("삭제에 실패했습니다.");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setImgSrc('');
        setRecordForm({ result: 'WIN', imgFile: null });
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        const rec = attendance.find(a => a.date === date);
        setRecordForm(rec ? { result: rec.result, imgFile: null } : { result: 'WIN', imgFile: null });
        setIsModalOpen(true);
    };

    // 🌟 화살표 이동 로직 개선 (연도 넘김 처리)
    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(y => y - 1);
            setCurrentMonth(12);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(y => y + 1);
            setCurrentMonth(1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 12, borderBottom: `2px solid ${myTeamColor}` }}>
                <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
                <h2 style={{ fontWeight: 800, fontSize: '18px', margin: 0, color: myTeamColor }}>{teamDisplayName} 직관 아카이브</h2>
                <div style={{ width: 24 }} />
            </div>

            {/* 🌟 날짜 컨트롤러 영역 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
                <button onClick={handlePrevMonth} style={{ border: 'none', background: 'none', color: myTeamColor, fontSize: 18, cursor: 'pointer', padding: '10px' }}>◀</button>
                
                {/* 🌟 날짜 클릭 시 DatePicker 모달 열기 */}
                <button 
                    onClick={() => { setTempYear(currentYear); setIsDatePickerOpen(true); }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '5px 15px', borderRadius: '10px', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <span style={{ fontWeight: 800, fontSize: 20, color: '#333' }}>
                        {currentYear}. {currentMonth.toString().padStart(2, '0')}
                    </span>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>클릭하여 날짜 변경</div>
                </button>

                <button onClick={handleNextMonth} style={{ border: 'none', background: 'none', color: myTeamColor, fontSize: 18, cursor: 'pointer', padding: '10px' }}>▶</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 10 }}>
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                    <span key={d} style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#e94560' : i === 6 ? '#3498db' : '#999' }}>{d}</span>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {calendarData.map((day, i) => {
                    const fullDate = day ? `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : null;
                    const dayRecord = fullDate ? attendance.find(a => a.date === fullDate) : null;

                    return (
                        <div
                            key={i}
                            onClick={() => day && handleDateClick(fullDate)}
                            style={{
                                display: 'flex', flexDirection: 'column', cursor: day ? 'pointer' : 'default', minHeight: '140px', visibility: day === null ? 'hidden' : 'visible'
                            }}
                        >
                            <span style={{ fontSize: 10, color: '#bbb', marginBottom: 4, height: '14px' }}>{day}</span>

                            <div style={{
                                width: '100%', aspectRatio: '2/3', border: '1px solid #eee', borderRadius: 4, position: 'relative', overflow: 'hidden', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}>
                                {dayRecord && (
                                    <>
                                        <div style={{
                                            fontSize: 10, fontWeight: 900, width: '100%', textAlign: 'center', color: dayRecord.result === 'WIN' ? '#2ecc71' : '#e74c3c', padding: '2px 0', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', zIndex: 2
                                        }}>
                                            {dayRecord.result}
                                        </div>
                                        <div style={{
                                            flex: 1, width: '90%', margin: '4px auto',
                                            backgroundImage: dayRecord.imgUrl ? `url(${dayRecord.imgUrl})` : 'none', 
                                            backgroundSize: 'cover', backgroundPosition: 'center', border: '2px dotted #ddd', borderRadius: 2
                                        }} />
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 🌟 날짜 선택(DatePicker) 모달 추가 */}
            {isDatePickerOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', width: '90%', maxWidth: '320px', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginBottom: 20, fontSize: 18, textAlign: 'center', fontWeight: 800, color: '#333' }}>달력 이동</h3>
                        
                        {/* 연도 조작부 */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 24, backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '12px' }}>
                            <button onClick={() => setTempYear(y => y - 1)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: myTeamColor }}>◀</button>
                            <span style={{ fontSize: 20, fontWeight: 800 }}>{tempYear}년</span>
                            <button onClick={() => setTempYear(y => y + 1)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: myTeamColor }}>▶</button>
                        </div>

                        {/* 월 선택 그리드 (1~12월) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                                const isSelected = currentYear === tempYear && currentMonth === m;
                                return (
                                    <button 
                                        key={m}
                                        onClick={() => {
                                            setCurrentYear(tempYear);
                                            setCurrentMonth(m);
                                            setIsDatePickerOpen(false); // 월 선택 시 바로 모달 닫기
                                        }}
                                        style={{ 
                                            padding: '12px 0', 
                                            borderRadius: '10px', 
                                            border: isSelected ? `2px solid ${myTeamColor}` : '1px solid #ddd', 
                                            background: isSelected ? myTeamColor : '#fff',
                                            color: isSelected ? '#fff' : '#444',
                                            fontWeight: isSelected ? 800 : 600,
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {m}월
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* 닫기 버튼 */}
                        <button onClick={() => setIsDatePickerOpen(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>✕</button>
                    </div>
                </div>
            )}

            {/* 기록 추가/수정 모달 */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto' }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 20, width: '90%', maxWidth: 400, position: 'relative' }}>
                        <h3 style={{ marginBottom: 20, fontSize: 16 }}>{selectedDate} 기록</h3>
                        
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>경기 결과</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {['WIN', 'LOSE'].map(r => (
                                    <button key={r} onClick={() => setRecordForm({ ...recordForm, result: r })}
                                        style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', fontWeight: 800, backgroundColor: recordForm.result === r ? (r === 'WIN' ? '#2ecc71' : '#e74c3c') : '#eee', color: recordForm.result === r ? '#fff' : '#888', cursor: 'pointer' }}>{r}</button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>우표 사진 (2:3 비율 크롭)</p>
                            <input type="file" accept="image/*" onChange={onSelectFile} style={{ fontSize: 12, marginBottom: 10, width: '100%' }} />
                            {imgSrc && (
                                <div style={{ textAlign: 'center', background: '#f5f5f5', padding: 10, borderRadius: 8 }}>
                                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={2 / 3}>
                                        <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} style={{ maxWidth: '100%', maxHeight: 300 }} />
                                    </ReactCrop>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            {attendance.find(a => a.date === selectedDate) && (
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