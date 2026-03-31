import { useState, useEffect } from 'react'

// KBO 구장별 위도/경도
const STADIUM_COORDS = {
  잠실:   { lat: 37.5121, lon: 127.0719, name: '잠실구장' },
  인천:   { lat: 37.4344, lon: 126.6931, name: '인천SSG랜더스필드' },
  수원:   { lat: 37.2997, lon: 127.0097, name: '수원KT위즈파크' },
  대구:   { lat: 35.8413, lon: 128.6812, name: '대구삼성라이온즈파크' },
  부산:   { lat: 35.1938, lon: 129.0618, name: '사직야구장' },
  광주:   { lat: 35.1682, lon: 126.8893, name: '광주KIA챔피언스필드' },
  대전:   { lat: 36.3174, lon: 127.4292, name: '대전한화생명이글스파크' },
  창원:   { lat: 35.2226, lon: 128.5819, name: '창원NC파크' },
  서울:   { lat: 37.4979, lon: 126.8694, name: '고척스카이돔' }, // 키움
  청주:   { lat: 36.6402, lon: 127.4447, name: '청주야구장' },
}

function getPrecipIcon(prob) {
  if (prob >= 70) return { icon: '🌧️', label: '비 예보', color: '#4a9eff' }
  if (prob >= 40) return { icon: '⛅', label: '흐림', color: '#8bb4cc' }
  return { icon: '☀️', label: '맑음', color: '#f5a623' }
}

// Open-Meteo 무료 API (API 키 불필요)
async function fetchPrecipitation(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat)
  url.searchParams.set('longitude', lon)
  url.searchParams.set('hourly', 'precipitation_probability')
  url.searchParams.set('timezone', 'Asia/Seoul')
  url.searchParams.set('forecast_days', '1')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('weather fetch failed')
  const json = await res.json()

  // 오늘 경기 시간대 (13시~18시) 강수확률 평균
  const hours = json.hourly?.time ?? []
  const probs = json.hourly?.precipitation_probability ?? []
  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

  const gameHourProbs = hours
    .map((h, i) => ({ h, p: probs[i] }))
    .filter(({ h }) => {
      if (!h.startsWith(today)) return false
      const hour = parseInt(h.slice(11, 13), 10)
      return hour >= 13 && hour <= 18
    })
    .map(({ p }) => p ?? 0)

  if (gameHourProbs.length === 0) return null
  return Math.round(gameHourProbs.reduce((a, b) => a + b, 0) / gameHourProbs.length)
}

// props: stadiumKey (string, e.g. '잠실'), className
export default function WeatherWidget({ stadiumKey = '잠실', className = '' }) {
  const [prob, setProb] = useState(null)  // null = loading
  const [error, setError] = useState(false)

  const coords = STADIUM_COORDS[stadiumKey] ?? STADIUM_COORDS['잠실']

  useEffect(() => {
    let cancelled = false
    setProb(null)
    setError(false)

    fetchPrecipitation(coords.lat, coords.lon)
      .then((p) => {
        if (!cancelled) setProb(p ?? 0)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => { cancelled = true }
  }, [stadiumKey])

  if (error) return null // 에러 시 조용히 숨김

  const { icon, label, color } = prob !== null ? getPrecipIcon(prob) : { icon: '⏳', label: '날씨 확인 중', color: '#aaa' }

  return (
    <div className={`weather-chip ${className}`} title={`${coords.name} 강수확률`}>
      <span className="weather-chip__icon">{icon}</span>
      <div className="weather-chip__info">
        <span className="weather-chip__label">{coords.name}</span>
        {prob !== null ? (
          <span className="weather-chip__prob" style={{ color }}>
            강수확률 {prob}%
          </span>
        ) : (
          <span className="weather-chip__prob" style={{ color: '#aaa' }}>날씨 확인 중...</span>
        )}
      </div>
      {prob !== null && prob >= 40 && (
        <span className="weather-chip__warn" title="우천 취소 가능성">⚠️</span>
      )}
    </div>
  )
}
