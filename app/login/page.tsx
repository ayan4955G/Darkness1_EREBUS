'use client'

import React, { FormEvent, useState } from 'react'
import { Eye, EyeOff, Sparkles, Server, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('operator@erebus.space')
  const [password, setPassword] = useState('••••••••••••')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      window.location.href = '/'
    }, 800)
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
          <div className="pixelize-filter-overlay" />
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

          {/* Social SSO Pill Container */}
          <div className="voyager-sso-pill">
            <button type="button" className="sso-btn" title="Sign in with Apple" aria-label="Sign in with Apple">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.95-.93.04-2.07.62-2.73 1.4-.59.68-1.1 1.78-.96 2.84 1.05.08 2.1-.51 2.73-1.29z"/>
              </svg>
            </button>
            <button type="button" className="sso-btn" title="Sign in with Google" aria-label="Sign in with Google">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#ea4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="#4285f4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#fbbc05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z" />
                <path fill="#34a853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
            </button>
            <button type="button" className="sso-btn" title="Sign in with Meta / GitHub" aria-label="Sign in with Meta / GitHub">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="voyager-or">or</div>

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
                <span className="flex items-center justify-center gap-2">
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
                <button type="button" onClick={() => setIsSignUp(false)} className="toggle-mode-btn">
                  Log in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button type="button" onClick={() => setIsSignUp(true)} className="toggle-mode-btn">
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
