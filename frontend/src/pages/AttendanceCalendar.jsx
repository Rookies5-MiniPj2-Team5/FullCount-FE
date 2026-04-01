import { useState, useMemo, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const TEAM_COLORS = {
    "두산": "#1a1748", "LG": "#C8102E", "SSG": "#CE0E2D", "키움": "#820024",
    "KT": "#1b1a1a", "삼성": "#074CA1", "한화": "#F37321", "NC": "#1D467A",
    "롯데": "#002561", "KIA": "#EA0029"
};

// --- 유틸리티: 이미지 2:3 크롭 실행 ---
async function getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // 크롭 영역 크기 설정
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

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) return;
            blob.name = fileName;
            resolve(URL.createObjectURL(blob));
        }, 'image/jpeg');
    });
}

export default function AttendanceCalendar({ onBack, user }) {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

    const [attendance, setAttendance] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);

    const [recordForm, setRecordForm] = useState({ result: 'WIN', img: null });

    const myTeamColor = TEAM_COLORS[user?.teamShortName] || "#e94560";
    const teamDisplayName = user?.teamName || user?.teamShortName || "나의";

    const calendarData = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        return [...Array(firstDayOfMonth).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    }, [currentYear, currentMonth]);

    const onSelectFile = (e) => {
        if (e.target.files?.[0]) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.onload = () => setImgSrc(reader.result.toString());
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // ✅ 이미지 로드 시 2:3 비율로 가운데 크롭 영역 설정
    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const aspect = 2 / 3; // 가로 2 : 세로 3
        setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, aspect, width, height), width, height));
    };

    const handleSave = async () => {
        let finalImg = recordForm.img;
        if (imgRef.current && completedCrop) {
            finalImg = await getCroppedImg(imgRef.current, completedCrop, 'cropped.jpg');
        }
        setAttendance([...attendance.filter(a => a.date !== selectedDate), { date: selectedDate, ...recordForm, img: finalImg }]);
        closeModal();
    };

    const handleDelete = () => {
        if (window.confirm('기록을 삭제하시겠습니까?')) {
            setAttendance(attendance.filter(a => a.date !== selectedDate));
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setImgSrc('');
        setRecordForm({ result: 'WIN', img: null });
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        const rec = attendance.find(a => a.date === date);
        setRecordForm(rec ? { result: rec.result, img: rec.img } : { result: 'WIN', img: null });
        setIsModalOpen(true);
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
            {/* 헤더 및 컨트롤러 생략 (기존과 동일) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 12, borderBottom: `2px solid ${myTeamColor}` }}>
                <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
                <h2 style={{ fontWeight: 800, fontSize: '18px', margin: 0, color: myTeamColor }}>{teamDisplayName} 직관 아카이브</h2>
                <div style={{ width: 24 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
                <button onClick={() => currentMonth > 3 && setCurrentMonth(m => m - 1)} style={{ border: 'none', background: 'none', color: myTeamColor, fontSize: 18, cursor: 'pointer' }}>◀</button>
                <span style={{ fontWeight: 800, fontSize: 20 }}>{currentYear}. {currentMonth.toString().padStart(2, '0')}</span>
                <button onClick={() => currentMonth < 10 && setCurrentMonth(m => m + 1)} style={{ border: 'none', background: 'none', color: myTeamColor, fontSize: 18, cursor: 'pointer' }}>▶</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 10 }}>
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                    <span key={d} style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#e94560' : i === 6 ? '#3498db' : '#999' }}>{d}</span>
                ))}
            </div>

            {/* 달력 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {calendarData.map((day, i) => (
                    <div
                        key={i}
                        onClick={() => day && handleDateClick(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: day ? 'pointer' : 'default',
                            minHeight: '140px', // ✅ 비율이 길어졌으므로 최소 높이를 조금 늘림
                            visibility: day === null ? 'hidden' : 'visible'
                        }}
                    >
                        <span style={{ fontSize: 10, color: '#bbb', marginBottom: 4, height: '14px' }}>
                            {day}
                        </span>

                        <div style={{
                            width: '100%',
                            aspectRatio: '2/3', // ✅ 달력 칸의 프레임 비율을 2:3으로 수정
                            border: '1px solid #eee',
                            borderRadius: 4,
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundColor: '#f9f9f9',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            {day && attendance.find(a => a.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`) && (
                                <>
                                    <div style={{
                                        fontSize: 10,
                                        fontWeight: 900,
                                        width: '100%',
                                        textAlign: 'center',
                                        color: attendance.find(a => a.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`).result === 'WIN' ? '#2ecc71' : '#e74c3c',
                                        padding: '2px 0',
                                        backgroundColor: '#fff',
                                        borderBottom: '1px solid #f0f0f0',
                                        zIndex: 2
                                    }}>
                                        {attendance.find(a => a.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`).result}
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        width: '90%', // ✅ 사진 너비를 살짝 키움
                                        margin: '4px auto',
                                        backgroundImage: `url(${attendance.find(a => a.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`).img})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '2px dotted #ddd',
                                        borderRadius: 2
                                    }} />
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 모달 */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto' }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 20, width: '90%', maxWidth: 400, position: 'relative' }}>
                        <h3 style={{ marginBottom: 20, fontSize: 16 }}>{selectedDate} 기록</h3>
                        
                        {/* 결과 선택 영역 생략 (기존 동일) */}
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
                                    <ReactCrop 
                                        crop={crop} 
                                        onChange={c => setCrop(c)} 
                                        onComplete={c => setCompletedCrop(c)} 
                                        aspect={2 / 3} // ✅ 크롭 가이드 비율을 2:3으로 수정
                                    >
                                        <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} style={{ maxWidth: '100%', maxHeight: 300 }} />
                                    </ReactCrop>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            {recordForm.img && <button onClick={handleDelete} style={{ flex: 1, padding: 14, background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>삭제</button>}
                            <button onClick={handleSave} style={{ flex: 1, padding: 14, background: myTeamColor, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>저장</button>
                        </div>
                        <button onClick={closeModal} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa' }}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
}