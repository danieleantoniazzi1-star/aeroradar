import React, { useEffect, useRef, useState } from 'react'

export default function AeroRadar({ userLat = 44.08, userLon = 9.85, rangeNm = 30 }) {
  const canvasRef = useRef(null)
  const [aircrafts, setAircrafts] = useState([])
  const [status, setStatus] = useState('Inizializzazione...')

  useEffect(() => {
    let isMounted = true

    const fetchAircraft = async () => {
      try {
        const latStr = userLat.toFixed(4)
        const lonStr = userLon.toFixed(4)

        // URL dell'API di destinazione
        const targetUrl = `https://opendata.adsb.fi/api/v3/lat/${latStr}/lon/${lonStr}/dist/${rangeNm}`

        // In PROD (GitHub Pages) incapsuliamo la chiamata nel CORS Proxy
        const url = import.meta.env.PROD
          ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
          : `/api-adsb/api/v3/lat/${latStr}/lon/${lonStr}/dist/${rangeNm}`

        const res = await fetch(url)

        if (res.status === 429) {
          if (isMounted) setStatus('RATE LIMIT • Pausa 10s')
          return
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const rawList = data?.aircraft || data?.ac

        if (isMounted) {
          if (Array.isArray(rawList)) {
            const parsed = rawList
              .map((s) => ({
                icao24: s.hex,
                callsign: s.flight?.trim() || s.hex?.toUpperCase() || 'N/A',
                lon: s.lon,
                lat: s.lat,
                altitudeFt: typeof s.alt_baro === 'number' ? s.alt_baro : (s.alt_geom || 0),
                velocityKts: Math.round(s.gs || 0),
                heading: s.track || s.mag_heading || 0,
                verticalRate: s.baro_rate || 0
              }))
              .filter((a) => a.lat != null && a.lon != null)

            setAircrafts(parsed)
            setStatus(`ONLINE • ${parsed.length} bersagli agganciati`)
          } else {
            setAircrafts([])
            setStatus('ONLINE • 0 bersagli nell\'area')
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Errore Fetch Voli:', err)
          setStatus('SINCRO IN CORSO • Attesa ciclo')
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let sweepAngle = 0

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(centerX, centerY) - 25

      ctx.fillStyle = '#020617'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ;[0.2, 0.4, 0.6, 0.8, 1].forEach((rRatio) => {
        const ringR = radius * rRatio
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringR, 0, 2 * Math.PI)
        ctx.stroke()

        ctx.fillStyle = '#10b981'
        ctx.font = '10px "IBM Plex Mono", monospace'
        const labelNm = Math.round(rangeNm * rRatio)
        ctx.fillText(`${labelNm} NM`, centerX + 4, centerY - ringR + 12)
      })
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(centerX, centerY - radius)
      ctx.lineTo(centerX, centerY + radius)
      ctx.moveTo(centerX - radius, centerY)
      ctx.lineTo(centerX + radius, centerY)
      ctx.stroke()

      ctx.fillStyle = '#34d399'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('N', centerX, centerY - radius - 8)
      ctx.fillText('S', centerX, centerY + radius + 16)
      ctx.fillText('E', centerX + radius + 12, centerY + 4)
      ctx.fillText('W', centerX - radius - 12, centerY + 4)

      sweepAngle += 0.025
      if (sweepAngle >= 2 * Math.PI) sweepAngle = 0

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

      aircrafts.forEach((ac) => {
        const dLat = (ac.lat - userLat) * 60
        const dLon = (ac.lon - userLon) * 60 * Math.cos((userLat * Math.PI) / 180)
        const distNm = Math.sqrt(dLat * dLat + dLon * dLon)

        if (distNm <= rangeNm) {
          const px = centerX + (dLon / rangeNm) * radius
          const py = centerY - (dLat / rangeNm) * radius

          ctx.save()
          ctx.translate(px, py)
          ctx.rotate((ac.heading * Math.PI) / 180)

          const color = ac.altitudeFt > 10000 ? '#38bdf8' : '#fbbf24'
          ctx.fillStyle = color
          ctx.strokeStyle = '#020617'
          ctx.lineWidth = 1.5

          ctx.beginPath()
          ctx.moveTo(0, -8)
          ctx.lineTo(6, 8)
          ctx.lineTo(0, 5)
          ctx.lineTo(-6, 8)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          ctx.restore()

          const verticalTrend = ac.verticalRate > 128 ? '↑' : ac.verticalRate < -128 ? '↓' : '='
          ctx.fillStyle = '#fef08a'
          ctx.textAlign = 'left'
          ctx.font = 'bold 11px monospace'
          ctx.fillText(ac.callsign, px + 10, py - 3)

          ctx.fillStyle = '#94a3b8'
          ctx.font = '10px monospace'
          ctx.fillText(`${ac.altitudeFt}ft ${verticalTrend}`, px + 10, py + 9)
        }
      })

      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
      ctx.fill()

      animationFrameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [aircrafts, userLat, userLon, rangeNm])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: '#10b981',
          fontFamily: 'monospace',
          fontSize: '12px',
          background: 'rgba(2,6,23,0.85)',
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #1e293b'
        }}
      >
        {status}
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        style={{
          maxWidth: '95vw',
          maxHeight: '95vw',
          borderRadius: '50%',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)',
          border: '2px solid #1e293b'
        }}
      />
    </div>
  )
}