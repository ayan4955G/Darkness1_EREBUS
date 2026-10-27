'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Rotate3d, Compass, RefreshCw, Move3d, Radio } from 'lucide-react'

interface Attitude3DViewerProps {
  accel?: { x: number | null; y: number | null; z: number | null }
  gyro?: { x: number | null; y: number | null; z: number | null }
  isLive?: boolean
}

export default function Attitude3DViewer({
  accel,
  gyro,
  isLive = false,
}: Attitude3DViewerProps) {
  // Manual drag orbit angles (for user interactive inspection)
  const [orbit, setOrbit] = useState<{ rotX: number; rotY: number }>({ rotX: -20, rotY: 35 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [lockToSensor, setLockToSensor] = useState(true)

  // Calibration zero offsets
  const [zeroOffset, setZeroOffset] = useState<{ pitch: number; roll: number; yaw: number }>({
    pitch: 0,
    roll: 0,
    yaw: 0,
  })

  // Integrated yaw angle state
  const yawRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(Date.now())

  // Current smoothed angles (for 60fps interpolation)
  const [smoothed, setSmoothed] = useState<{ pitch: number; roll: number; yaw: number }>({
    pitch: 0,
    roll: 0,
    yaw: 0,
  })

  const ax = accel?.x ?? 0
  const ay = accel?.y ?? 0
  const az = accel?.z ?? 1
  const gx = gyro?.x ?? 0
  const gy = gyro?.y ?? 0
  const gz = gyro?.z ?? 0

  // Calculate target physical Pitch & Roll from accelerometer vectors (g)
  const targetAngles = useMemo(() => {
    // Pitch (rotation around X axis): nose up/down
    // theta = atan2(-ax, sqrt(ay^2 + az^2)) * 180 / PI
    const rawPitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI)

    // Roll (rotation around Y axis): tilt left/right
    // phi = atan2(ay, az) * 180 / PI
    const rawRoll = Math.atan2(ay, az) * (180 / Math.PI)

    return {
      pitch: rawPitch - zeroOffset.pitch,
      roll: rawRoll - zeroOffset.roll,
    }
  }, [ax, ay, az, zeroOffset.pitch, zeroOffset.roll])

  // Integrate gyro Z rate (deg/s) to update Yaw
  useEffect(() => {
    const now = Date.now()
    const dt = Math.min(0.2, (now - lastTimeRef.current) / 1000)
    lastTimeRef.current = now

    if (Math.abs(gz) > 0.1) {
      // Integrate gyro rate
      yawRef.current = (yawRef.current + gz * dt) % 360
    }
  }, [gz])

  // Smooth lerp animation loop (60fps)
  useEffect(() => {
    let animId: number

    const updateLoop = () => {
      setSmoothed((prev) => {
        const factor = 0.25 // Smooth responsiveness factor
        const targetPitch = targetAngles.pitch
        const targetRoll = targetAngles.roll
        const targetYaw = yawRef.current - zeroOffset.yaw

        return {
          pitch: prev.pitch + (targetPitch - prev.pitch) * factor,
          roll: prev.roll + (targetRoll - prev.roll) * factor,
          yaw: prev.yaw + (targetYaw - prev.yaw) * factor,
        }
      })

      animId = requestAnimationFrame(updateLoop)
    }

    animId = requestAnimationFrame(updateLoop)
    return () => cancelAnimationFrame(animId)
  }, [targetAngles, zeroOffset.yaw])

  // Mouse drag handlers for interactive 3D rotation inspection
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setDragStart({ x: e.clientX, y: e.clientY })

    setOrbit((prev) => ({
      rotX: Math.max(-85, Math.min(85, prev.rotX - dy * 0.5)),
      rotY: prev.rotY + dx * 0.5,
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleResetOrbit = () => {
    setOrbit({ rotX: -20, rotY: 35 })
  }

  const handleZeroCalibration = () => {
    setZeroOffset({
      pitch: Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI),
      roll: Math.atan2(ay, az) * (180 / Math.PI),
      yaw: yawRef.current,
    })
  }

  // Combine orbit camera and hardware sensor rotation
  const modelTransform = lockToSensor
    ? `rotateX(${orbit.rotX}deg) rotateY(${orbit.rotY}deg) rotateX(${smoothed.pitch}deg) rotateZ(${smoothed.roll}deg) rotateY(${-smoothed.yaw}deg)`
    : `rotateX(${orbit.rotX}deg) rotateY(${orbit.rotY}deg)`

  return (
    <div className="attitude-3d-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 3D Viewport Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          borderRadius: '14px 14px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Rotate3d size={16} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em' }}>
            3D Spacecraft Attitude
          </span>
          {isLive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 800,
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.4)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              REAL-TIME
            </span>
          )}
        </div>

        {/* Viewport Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setLockToSensor(!lockToSensor)}
            title={lockToSensor ? 'Lock: Tracking Physical Sensor' : 'Unlock: Manual Orbit'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: lockToSensor ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
              color: lockToSensor ? '#38bdf8' : '#94a3b8',
              border: lockToSensor ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #334155',
            }}
          >
            <Radio size={12} />
            {lockToSensor ? 'Sensor Tracking' : 'Manual View'}
          </button>

          <button
            type="button"
            onClick={handleZeroCalibration}
            title="Zero Calibration: Set current orientation as 0° baseline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
            }}
          >
            <Compass size={12} />
            Calibrate
          </button>

          <button
            type="button"
            onClick={handleResetOrbit}
            title="Reset 3D Camera Orbit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
            }}
          >
            <RefreshCw size={12} />
            Reset View
          </button>
        </div>
      </div>

      {/* 3D Interactive Viewport Canvas */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: 'relative',
          height: 240,
          background: 'radial-gradient(ellipse at center, #1e293b 0%, #090d16 100%)',
          perspective: 800,
          perspectiveOrigin: '50% 50%',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Orbital Background Stars & Coordinate Horizon Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(#334155 1px, transparent 1px), radial-gradient(rgba(56, 189, 248, 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px, 72px 72px',
            backgroundPosition: '0 0, 12px 12px',
            opacity: 0.45,
            pointerEvents: 'none',
          }}
        />

        {/* Horizon Grid Disc */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 220,
            height: 220,
            marginTop: -110,
            marginLeft: -110,
            borderRadius: '50%',
            border: '1px dashed rgba(56, 189, 248, 0.25)',
            boxShadow: 'inset 0 0 40px rgba(56, 189, 248, 0.08)',
            transform: `rotateX(${orbit.rotX + 90}deg) rotateZ(${orbit.rotY}deg) translateZ(-60px)`,
            transformStyle: 'preserve-3d',
            pointerEvents: 'none',
          }}
        />

        {/* 3D World Transformation Node */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: modelTransform,
            transition: isDragging ? 'none' : 'transform 0.06s linear',
          }}
        >
          {/* ================= Coordinate Vector Axes ================= */}
          {/* X-Axis (Pitch - Red) */}
          <div
            style={{
              position: 'absolute',
              width: 90,
              height: 2,
              background: '#ef4444',
              left: 0,
              top: 0,
              boxShadow: '0 0 8px #ef4444',
              transformOrigin: 'left center',
              transform: 'rotateZ(0deg)',
            }}
          >
            <span style={{ position: 'absolute', right: -18, top: -7, fontSize: 10, fontWeight: 900, color: '#ef4444' }}>
              +X
            </span>
          </div>

          {/* Y-Axis (Roll - Green) */}
          <div
            style={{
              position: 'absolute',
              width: 90,
              height: 2,
              background: '#22c55e',
              left: 0,
              top: 0,
              boxShadow: '0 0 8px #22c55e',
              transformOrigin: 'left center',
              transform: 'rotateY(90deg)',
            }}
          >
            <span style={{ position: 'absolute', right: -18, top: -7, fontSize: 10, fontWeight: 900, color: '#22c55e' }}>
              +Y
            </span>
          </div>

          {/* Z-Axis (Yaw - Blue) */}
          <div
            style={{
              position: 'absolute',
              width: 90,
              height: 2,
              background: '#38bdf8',
              left: 0,
              top: 0,
              boxShadow: '0 0 8px #38bdf8',
              transformOrigin: 'left center',
              transform: 'rotateZ(-90deg)',
            }}
          >
            <span style={{ position: 'absolute', right: -18, top: -7, fontSize: 10, fontWeight: 900, color: '#38bdf8' }}>
              +Z
            </span>
          </div>

          {/* ================= 3D Spacecraft / Satellite Body ================= */}
          <div
            style={{
              position: 'absolute',
              width: 60,
              height: 70,
              left: -30,
              top: -35,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Satellite Core Box: 6 Faces */}
            {/* Front Face (+Z) */}
            <div
              style={{
                position: 'absolute',
                width: 60,
                height: 70,
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1.5px solid #475569',
                borderRadius: 4,
                boxShadow: 'inset 0 0 15px rgba(56, 189, 248, 0.25)',
                transform: 'translateZ(25px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {/* Sensor Lens */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #38bdf8 0%, #0369a1 70%, #082f49 100%)',
                  boxShadow: '0 0 8px #38bdf8',
                  border: '2px solid #94a3b8',
                }}
              />
              <span style={{ fontSize: 7, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em' }}>
                EREBUS-1
              </span>
            </div>

            {/* Back Face (-Z) */}
            <div
              style={{
                position: 'absolute',
                width: 60,
                height: 70,
                background: 'linear-gradient(135deg, #0f172a, #020617)',
                border: '1.5px solid #334155',
                borderRadius: 4,
                transform: 'rotateY(180deg) translateZ(25px)',
              }}
            />

            {/* Left Face (-X) */}
            <div
              style={{
                position: 'absolute',
                width: 50,
                height: 70,
                left: 5,
                background: 'linear-gradient(to right, #1e293b, #0f172a)',
                border: '1.5px solid #334155',
                transform: 'rotateY(-90deg) translateZ(30px)',
              }}
            />

            {/* Right Face (+X) */}
            <div
              style={{
                position: 'absolute',
                width: 50,
                height: 70,
                left: 5,
                background: 'linear-gradient(to left, #1e293b, #0f172a)',
                border: '1.5px solid #334155',
                transform: 'rotateY(90deg) translateZ(30px)',
              }}
            />

            {/* Top Face (+Y) */}
            <div
              style={{
                position: 'absolute',
                width: 60,
                height: 50,
                top: 10,
                background: 'linear-gradient(to bottom, #334155, #1e293b)',
                border: '1.5px solid #475569',
                transform: 'rotateX(90deg) translateZ(35px)',
              }}
            />

            {/* Bottom Face (-Y) */}
            <div
              style={{
                position: 'absolute',
                width: 60,
                height: 50,
                top: 10,
                background: '#090d16',
                border: '1.5px solid #1e293b',
                transform: 'rotateX(-90deg) translateZ(35px)',
              }}
            />

            {/* Top Telemetry Antenna Mast */}
            <div
              style={{
                position: 'absolute',
                width: 2,
                height: 40,
                left: 29,
                top: -40,
                background: 'linear-gradient(to top, #94a3b8, #38bdf8)',
                boxShadow: '0 0 6px #38bdf8',
                transformOrigin: 'bottom center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: -3,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  boxShadow: '0 0 8px #f59e0b',
                }}
              />
            </div>

            {/* Left Solar Panel Array */}
            <div
              style={{
                position: 'absolute',
                width: 68,
                height: 48,
                left: -72,
                top: 11,
                background:
                  'repeating-linear-gradient(90deg, #1e3a8a 0px, #1e3a8a 12px, #0f172a 13px, #0f172a 14px), repeating-linear-gradient(0deg, transparent 0px, transparent 11px, #38bdf8 12px)',
                border: '1.5px solid #38bdf8',
                borderRadius: 3,
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                transformOrigin: 'right center',
              }}
            />

            {/* Right Solar Panel Array */}
            <div
              style={{
                position: 'absolute',
                width: 68,
                height: 48,
                right: -72,
                top: 11,
                background:
                  'repeating-linear-gradient(90deg, #1e3a8a 0px, #1e3a8a 12px, #0f172a 13px, #0f172a 14px), repeating-linear-gradient(0deg, transparent 0px, transparent 11px, #38bdf8 12px)',
                border: '1.5px solid #38bdf8',
                borderRadius: 3,
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                transformOrigin: 'left center',
              }}
            />
          </div>
        </div>

        {/* Drag Hint overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: '#64748b',
            fontSize: 10,
            pointerEvents: 'none',
          }}
        >
          <Move3d size={12} /> Click & drag to rotate view
        </div>

        {/* Active Coordinate Vectors Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 10,
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: '#ef4444' }}>● Pitch (X)</span>
          <span style={{ color: '#22c55e' }}>● Roll (Y)</span>
          <span style={{ color: '#38bdf8' }}>● Yaw (Z)</span>
        </div>
      </div>

      {/* Real-time Numeric Telemetry Cards (Pitch X, Roll Y, Yaw Z) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          padding: '14px',
          background: '#090d16',
          borderTop: '1px solid #1e293b',
          borderRadius: '0 0 14px 14px',
        }}
      >
        {/* Pitch X */}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#f87171', letterSpacing: '0.04em' }}>
              PITCH (X)
            </span>
            <span style={{ fontSize: 9, color: '#64748b' }}>AX: {ax.toFixed(2)}g</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <strong style={{ fontSize: 20, color: '#f8fafc', fontWeight: 800 }}>
              {smoothed.pitch.toFixed(1)}
            </strong>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>°</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 9, color: '#94a3b8' }}>
            Gyro X: <b style={{ color: '#f1f5f9' }}>{gx.toFixed(1)}°/s</b>
          </div>
        </div>

        {/* Roll Y */}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', letterSpacing: '0.04em' }}>
              ROLL (Y)
            </span>
            <span style={{ fontSize: 9, color: '#64748b' }}>AY: {ay.toFixed(2)}g</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <strong style={{ fontSize: 20, color: '#f8fafc', fontWeight: 800 }}>
              {smoothed.roll.toFixed(1)}
            </strong>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>°</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 9, color: '#94a3b8' }}>
            Gyro Y: <b style={{ color: '#f1f5f9' }}>{gy.toFixed(1)}°/s</b>
          </div>
        </div>

        {/* Yaw Z */}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
              YAW (Z)
            </span>
            <span style={{ fontSize: 9, color: '#64748b' }}>AZ: {az.toFixed(2)}g</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <strong style={{ fontSize: 20, color: '#f8fafc', fontWeight: 800 }}>
              {((smoothed.yaw % 360 + 360) % 360).toFixed(1)}
            </strong>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>°</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 9, color: '#94a3b8' }}>
            Gyro Z: <b style={{ color: '#f1f5f9' }}>{gz.toFixed(1)}°/s</b>
          </div>
        </div>
      </div>
    </div>
  )
}
