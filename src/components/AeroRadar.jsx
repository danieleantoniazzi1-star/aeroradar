import React, { useEffect, useRef, useState } from 'react'

export default function AeroRadar({ userLat = 44.08, userLon = 9.85, rangeNm = 30 }) {
  const canvasRef = useRef(null)
  const [statusInfo, setStatusInfo] = useState({ label: 'INIZIALIZZAZIONE', detail: 'Attesa ciclo dati...' })

  const aircraftsRef = useRef([])
  const sweepAngleRef = useRef(0)

  // 1. Fetching con API sicura e Cache-Buster
  useEffect(() => {
    let isMounted = true
    const MY_WORKER_URL = 'https://aeroradar-proxy.daniele-antoniazzi1.workers.dev'

    const fetchAircraft = async () => {
      try {
        const latStr = userLat.toFixed(4)
        const lonStr = userLon.toFixed(4)
        const timestamp = Date.now()

        // Invia i soli parametri lat, lon e dist invece dell'URL completo
        const url = import.meta.env.PROD
          ? `${MY_WORKER_URL}?lat=${latStr}&lon=${lonStr}&dist=${rangeNm}&_t=${timestamp}`
          : `/api-adsb/api/v3/lat/${latStr}/lon/${lonStr}/dist/${rangeNm}?_t=${timestamp}`

        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const rawList = data?.aircraft || data?.ac

        if (isMounted && Array.isArray(rawList)) {
          const now = Date.now()
          const parsed = rawList
            .map((s) => ({
              icao24: s.hex,
              callsign: s.flight?.trim() || s.hex?.toUpperCase() || 'N/A',
              lon: s.lon,
              lat: s.lat,
              altitudeFt: typeof s.alt_baro === 'number' ? s.alt_baro : (s.alt_geom || 0),
              velocityKts: Math.round(s.gs || 0),
              heading: s.track || s.mag_heading || 0,
              verticalRate: s.baro_rate || 0,
              lastUpdated: now
            }))
            .filter((a) => a.lat != null && a.lon != null)

          if (parsed.length > 0) {
            aircraftsRef.current = parsed
            setStatusInfo({ label: 'ONLINE', detail: `${parsed.length} velivoli agganciati` })
          } else if (aircraftsRef.current.length > 0) {
            setStatusInfo({ label: 'ONLINE', detail: `${aircraftsRef.current.length} velivoli (mantenimento)` })
          } else {
            setStatusInfo({ label: 'ONLINE', detail: '0 velivoli nell\'area' })
          }
        }
      } catch (err) {
        if (isMounted && aircraftsRef.current.length === 0) {
          setStatusInfo({ label: 'SINCRO IN CORSO', detail: 'Attesa ripristino' })
        }
      }
    }

    fetchAircraft()
    const interval = setInterval(fetchAircraft, 8000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [userLat, userLon, rangeNm])

  // 2. Render Canvas (Risoluzione nativa 800x800)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(centerX, centerY) - 30
      const now = Date.now()

      ctx.fillStyle = '#020617'
      ctx.fillRect(0, 0, width, height)

      // Anelli di portata
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ;[0.2, 0.4, 0.6, 0.8, 1].forEach((rRatio) => {
        const ringR = radius * rRatio
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringR, 0, 2 * Math.PI)
        ctx.stroke()

        ctx.fillStyle = '#10b981'
        ctx.font = '12px "IBM Plex Mono", monospace'
        const labelNm = Math.round(rangeNm * rRatio)
        ctx.fillText(`${labelNm} NM`, centerX + 6, centerY - ringR + 14)
      })
      ctx.setLineDash([])

      // Assi Cardinali
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - radius)
      ctx.lineTo(centerX, centerY + radius)
      ctx.moveTo(centerX - radius, centerY)
      ctx.lineTo(centerX + radius, centerY)
      ctx.stroke()

      ctx.fillStyle = '#34d399'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('N', centerX, centerY - radius - 10)
      ctx.fillText('S', centerX, centerY + radius + 20)
      ctx.fillText('E', centerX + radius + 16, centerY + 5)
      ctx.fillText('W', centerX - radius - 16, centerY + 5)

      // Spazzamento radar
      sweepAngleRef.current += 0.025
      if (sweepAngleRef.current >= 2 * Math.PI) sweepAngleRef.current = 0

      const sweepAngle = sweepAngleRef.current
      ctx.save()
      ctx.translate(centerX, centerY)
      const sweepX = radius * Math.sin(sweepAngle)
      const sweepY = -radius * Math.cos(sweepAngle)

      const trailAngle = Math.PI / 3
      const stopRatio = trailAngle / (2 * Math.PI)

      const gradient = ctx.createConicGradient(sweepAngle - Math.PI / 2 - trailAngle, 0, 0)
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.0)')
      gradient.addColorStop(stopRatio, 'rgba(16, 185, 129, 0.25)')
      gradient.addColorStop(stopRatio + 0.01, 'rgba(16, 185, 129, 0.0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, 2 * Math.PI)
      ctx.fill()

      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sweepX, sweepY)
      ctx.stroke()
      ctx.restore()

      // Tracciamento ed Estrapolazione del Movimento
      aircraftsRef.current.forEach((ac) => {
        const dtSeconds = Math.max(0, (now - ac.lastUpdated) / 1000)
        const distTraveledNm = (ac.velocityKts / 3600) * dtSeconds

        const headingRad = (ac.heading * Math.PI) / 180
        const dLatEst = (distTraveledNm * Math.cos(headingRad)) / 60
        const dLonEst = (distTraveledNm * Math.sin(headingRad)) / (60 * Math.cos((userLat * Math.PI) / 180))

        const currentLat = ac.lat + dLatEst
        const currentLon = ac.lon + dLonEst

        const dLat = (currentLat - userLat) * 60
        const dLon = (currentLon - userLon) * 60 * Math.cos((userLat * Math.PI) / 180)
        const distNm = Math.sqrt(dLat * dLat + dLon * dLon)

        if (distNm <= rangeNm) {
          const px = centerX + (dLon / rangeNm) * radius
          const py = centerY - (dLat / rangeNm) * radius

          ctx.save()
          ctx.translate(px, py)
          ctx.rotate(headingRad)

          const color = ac.altitudeFt > 10000 ? '#38bdf8' : '#fbbf24'
          ctx.fillStyle = color
          ctx.strokeStyle = '#020617'
          ctx.lineWidth = 1.5

          ctx.beginPath()
          ctx.moveTo(0, -9)
          ctx.lineTo(7, 9)
          ctx.lineTo(0, 6)
          ctx.lineTo(-7, 9)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          ctx.restore()

          const verticalTrend = ac.verticalRate > 128 ? '↑' : ac.verticalRate < -128 ? '↓' : '='
          ctx.fillStyle = '#fef08a'
          ctx.textAlign = 'left'
          ctx.font = 'bold 12px monospace'
          ctx.fillText(ac.callsign, px + 12, py - 2)

          ctx.fillStyle = '#94a3b8'
          ctx.font = '11px monospace'
          ctx.fillText(`${ac.altitudeFt}ft ${verticalTrend}`, px + 12, py + 11)
        }
      })

      // Posizione Utente
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI)
      ctx.fill()

      animationFrameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [userLat, userLon, rangeNm])

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Box di stato sovrapposto leggero */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          color: '#10b981',
          fontFamily: 'monospace',
          fontSize: '11px',
          background: 'rgba(2, 6, 23, 0.85)',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid #1e293b',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>
          • {statusInfo.label}
        </span>
        <span style={{ color: '#94a3b8', fontSize: '10px' }}>
          {statusInfo.detail}
        </span>
      </div>

      {/* Canvas massimizzato sia per landscape che desktop fullscreen */}
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        style={{
          width: 'min(92vw, 86vh)',
          height: 'min(92vw, 86vh)',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          boxShadow: '0 0 35px rgba(16, 185, 129, 0.18)',
          border: '2px solid #1e293b'
        }}
      />
    </div>
  )
}