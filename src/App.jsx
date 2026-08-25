import React, { useState, useEffect, useCallback } from 'react'
import AeroRadar from './components/AeroRadar'

// --- Helper Fullscreen con prefissi per compatibilità browser vecchi (Android 7 / webkit) ---
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  )
}

function requestFullscreenCompat(el) {
  const fn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.webkitRequestFullScreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  if (fn) return fn.call(el)
  return Promise.reject(new Error('Fullscreen API non supportata'))
}

function exitFullscreenCompat() {
  const fn =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.webkitCancelFullScreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen
  if (fn) return fn.call(document)
  return Promise.reject(new Error('Fullscreen API non supportata'))
}

export default function App() {
  const [position, setPosition] = useState({ lat: 44.08, lon: 9.85 }) // Default: Golfo della Spezia / Tirreno
  const [rangeNm, setRangeNm] = useState(30)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Geolocalizzazione Utente
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        },
        (err) => console.warn('GPS non disponibile, uso posizione predefinita:', err.message)
      )
    }
  }, [])

  // Ascolta i cambi di stato fullscreen (anche da tasto indietro del tablet)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!getFullscreenElement())
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (getFullscreenElement()) {
      exitFullscreenCompat().catch(() => {})
    } else {
      requestFullscreenCompat(document.documentElement).catch(() => {
        // Fullscreen non disponibile su questo dispositivo/browser: ignora silenziosamente
      })
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', background: '#020617', fontFamily: 'monospace' }}>
      {/* Header Console */}
      <header style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>RANGE:</span>
        {[15, 30, 50].map((r) => (
          <button
            key={r}
            onClick={() => setRangeNm(r)}
            style={{
              background: rangeNm === r ? '#10b981' : '#0f172a',
              color: rangeNm === r ? '#020617' : '#94a3b8',
              border: '1px solid #1e293b',
              padding: '4px 10px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {r} NM
          </button>
        ))}

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
          aria-label={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
          style={{
            background: isFullscreen ? '#10b981' : '#0f172a',
            color: isFullscreen ? '#020617' : '#94a3b8',
            border: '1px solid #1e293b',
            padding: '5px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8V5a2 2 0 0 1 2-2h3" />
              <path d="M16 3h3a2 2 0 0 1 2 2v3" />
              <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
              <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
            </svg>
          )}
        </button>
      </header>
      <AeroRadar userLat={position.lat} userLon={position.lon} rangeNm={rangeNm} />
    </div>
  )
}
