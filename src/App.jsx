import React, { useState, useEffect } from 'react'
import AeroRadar from './components/AeroRadar'

export default function App() {
  const [position, setPosition] = useState({ lat: 44.08, lon: 9.85 }) // Default: Golfo della Spezia / Tirreno
  const [rangeNm, setRangeNm] = useState(30)

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
      </header>

      <AeroRadar userLat={position.lat} userLon={position.lon} rangeNm={rangeNm} />
    </div>
  )
}