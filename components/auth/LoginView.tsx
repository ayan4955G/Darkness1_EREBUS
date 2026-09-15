'use client'

import React, { FormEvent, useState } from 'react'
import { Eye, EyeOff, Sparkles, Server, CheckCircle2 } from 'lucide-react'

interface LoginViewProps {
  onLoginSuccess?: () => void
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('operator@erebus.space')
  const [password, setPassword] = useState('••••••••••••')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('erebus_authenticated', 'true')
    }
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        window.location.href = '/'
      }
    }, 700)
  }

  return (
    <main className="voyager-login-wrap">
      <div className="voyager-card">
        {/* LEFT SPATIAL VISUAL SECTION WITH FLOATING TELEMETRY PINS */}
        <section className="voyager-visual-side">
          <video
            className="voyager-space-video"
            src="/panel_video.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="voyager-overlay-gradient" />

          {/* FLOATING SPATIAL PIN 1: EREBUS-CORE */}
          <div className="spatial-pin pin-one">
            <div className="pin-stem">
              <span className="pin-dot pulse-dot-cyan" />
              <div className="pin-line" />
            </div>
            <div className="glass-callout-pill">
              <div className="callout-icon">
                <Server className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="callout-text">
                <span className="callout-sub">EREBUS-CORE</span>
                <strong className="callout-title">LEO Data Center 01</strong>
              </div>
            </div>
          </div>

          {/* FLOATING SPATIAL PIN 2: TELEMETRY STATS */}
          <div className="spatial-pin pin-two">
            <div className="pin-stem">
              <span className="pin-dot pulse-dot-violet" />
              <div className="pin-line" />
            </div>
            <div className="glass-callout-card">
              <strong className="callout-stat">7.66 km/s</strong>
              <span className="callout-desc">
                Optical telemetry nominal
                <br />
                18.6 Gbps Downlink
              </span>
            </div>
          </div>

          {/* FLOATING SPATIAL PIN 3: ODYSSEY-7 TRAIL TAG */}
          <div className="spatial-pin pin-three">
            <div className="pin-stem">
              <span className="pin-dot pulse-dot-white" />
              <div className="pin-line" />
            </div>
            <div className="white-callout-pill">ODYSSEY-7 Relay</div>
          </div>
        </section>

        {/* RIGHT FORM SECTION */}
        <section className="voyager-form-side">
          {/* Brand Logo */}
          <div className="voyager-brand">
            <div className="voyager-logo-mark">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="voyager-logo-text">erebus</span>
          </div>

          {/* Heading */}
          <h1 className="voyager-heading">
            {isSignUp ? 'Start your space mission' : 'Command your space cloud'}
          </h1>


          {/* Form */}
          <form onSubmit={handleSubmit} className="voyager-form">
            {isSignUp && (
              <div className="input-pill-wrap">
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="voyager-input-pill"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="input-pill-wrap">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="voyager-input-pill"
                required
              />
            </div>

            <div className="input-pill-wrap password-pill-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="voyager-input-pill"
                required
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button type="submit" className="voyager-submit-pill">
              {submitted ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Connecting to Orbit...
                </span>
              ) : isSignUp ? (
                'Create Account & Start'
              ) : (
                'Start'
              )}
            </button>
          </form>

          {/* Bottom Toggle */}
          <div className="voyager-footer-toggle">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="toggle-mode-btn"
                >
                  Log in
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="toggle-mode-btn"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
