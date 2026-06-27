'use client'

import React from 'react'

interface PlaceholderProps {
  brand: string
  categorySlug: string
  name: string
  className?: string
}

export function ProductPlaceholder({ brand, categorySlug, name, className = '' }: PlaceholderProps) {
  const brandName = brand.trim()
  const displayBrand = brandName || 'INTECH'
  
  // Xác định màu sắc chủ đạo của hãng để vẽ và tạo gradient background
  const getBrandColors = (b: string) => {
    const nameLower = b.toLowerCase()
    if (nameLower.includes('cisco')) {
      return {
        primary: '#1d63ed', // Blue
        secondary: '#00bceb', // Light Blue
        bgGradient: 'linear-gradient(135deg, #0d1e3d 0%, #1a365d 100%)',
        textColor: '#e2e8f0'
      }
    }
    if (nameLower.includes('fortinet') || nameLower.includes('fortigate')) {
      return {
        primary: '#c026d3', // Crimson / Redish Purple
        secondary: '#dc2626', // Red
        bgGradient: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 100%)',
        textColor: '#fdf4ff'
      }
    }
    if (nameLower.includes('aruba') || nameLower.includes('hpe')) {
      return {
        primary: '#f97316', // Orange
        secondary: '#eab308', // Yellow
        bgGradient: 'linear-gradient(135deg, #2d1a0f 0%, #1c1917 100%)',
        textColor: '#fff7ed'
      }
    }
    if (nameLower.includes('ruijie') || nameLower.includes('reyee')) {
      return {
        primary: '#2563eb', // Blue
        secondary: '#3b82f6', // Bright Blue
        bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        textColor: '#f1f5f9'
      }
    }
    if (nameLower.includes('ubiquiti') || nameLower.includes('unifi')) {
      return {
        primary: '#0055ff', // Unifi Blue
        secondary: '#38bdf8', // Sky Blue
        bgGradient: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        textColor: '#f0f9ff'
      }
    }
    // Default brand colors
    return {
      primary: '#0f766e', // Teal
      secondary: '#14b8a6', 
      bgGradient: 'linear-gradient(135deg, #091e1d 0%, #020617 100%)',
      textColor: '#f0fdfa'
    }
  }

  const colors = getBrandColors(displayBrand)

  // Vẽ SVG tương ứng với loại thiết bị
  const renderHardwareSvg = () => {
    const slug = categorySlug.toLowerCase()
    
    if (slug.includes('switch')) {
      // Thiết bị Switch rackmount 19-inch
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main rack unit body */}
          <rect x="10" y="25" width="180" height="30" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Left Rack Ear (tai rackmount) */}
          <rect x="4" y="21" width="6" height="38" rx="1" fill="#475569" />
          <circle cx="7" cy="27" r="1" fill="#94a3b8" />
          <circle cx="7" cy="53" r="1" fill="#94a3b8" />
          
          {/* Right Rack Ear */}
          <rect x="190" y="21" width="6" height="38" rx="1" fill="#475569" />
          <circle cx="193" cy="27" r="1" fill="#94a3b8" />
          <circle cx="193" cy="53" r="1" fill="#94a3b8" />

          {/* Logo / Brand Plate */}
          <rect x="18" y="32" width="30" height="6" rx="1" fill="#0f172a" />
          <text x="20" y="37" fontFamily="monospace" fontSize="4" fontWeight="bold" fill={colors.secondary}>{displayBrand.slice(0, 10).toUpperCase()}</text>

          {/* RJ45 Ports - Group 1 (8 Ports) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const x = 55 + i * 8
            const active = i % 3 === 0
            const amber = i === 4
            return (
              <g key={`port1-${i}`}>
                {/* Port socket */}
                <rect x={x} y={32} width="6" height="6" rx="1" fill="#020617" stroke="#334155" strokeWidth="0.5" />
                {/* Internal pins representation */}
                <line x1={x + 1} y1={33} x2={x + 5} y2={33} stroke="#475569" strokeWidth="0.5" />
                {/* LED indicators above the port */}
                <circle cx={x + 2} cy={30} r="0.6" fill={active ? '#10b981' : amber ? '#f59e0b' : '#334155'} />
                <circle cx={x + 4} cy={30} r="0.6" fill={active ? '#10b981' : '#334155'} />
              </g>
            )
          })}

          {/* RJ45 Ports - Group 2 (8 Ports) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const x = 125 + i * 8
            const active = i % 2 === 0
            return (
              <g key={`port2-${i}`}>
                <rect x={x} y={32} width="6" height="6" rx="1" fill="#020617" stroke="#334155" strokeWidth="0.5" />
                <line x1={x + 1} y1={33} x2={x + 5} y2={33} stroke="#475569" strokeWidth="0.5" />
                <circle cx={x + 2} cy={30} r="0.6" fill={active ? '#10b981' : '#334155'} />
                <circle cx={x + 4} cy={30} r="0.6" fill={active ? '#10b981' : '#334155'} />
              </g>
            )
          })}

          {/* SFP Uplink ports */}
          <rect x="17" y="44" width="8" height="5" rx="0.5" fill="#0f172a" stroke="#475569" strokeWidth="0.5" />
          <rect x="27" y="44" width="8" height="5" rx="0.5" fill="#0f172a" stroke="#475569" strokeWidth="0.5" />
          <circle cx="21" cy="47" r="0.5" fill="#10b981" />
          <circle cx="31" cy="47" r="0.5" fill="#10b981" />

          {/* Ventilation grilles on the left */}
          <line x1="175" y1="33" x2="175" y2="47" stroke="#334155" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="178" y1="33" x2="178" y2="47" stroke="#334155" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="181" y1="33" x2="181" y2="47" stroke="#334155" strokeWidth="1" strokeDasharray="1 1" />

          {/* Main Status LEDs */}
          <circle cx="12" cy="35" r="1" fill="#10b981" /> {/* Power */}
          <circle cx="12" cy="40" r="1" fill="#10b981" /> {/* Status */}
          <circle cx="12" cy="45" r="1" fill="#10b981" /> {/* Act */}
        </svg>
      )
    }

    if (slug.includes('wifi') || slug.includes('ap') || slug.includes('access-point')) {
      // Thiết bị Access Point gắn trần (ví dụ Aruba AP, Unifi)
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sóng WiFi phát ra */}
          <circle cx="100" cy="60" r="55" stroke={colors.secondary} strokeWidth="1" strokeDasharray="3 6" opacity="0.15" />
          <circle cx="100" cy="60" r="45" stroke={colors.primary} strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />
          <circle cx="100" cy="60" r="35" stroke={colors.secondary} strokeWidth="1" opacity="0.45" />

          {/* Body AP tròn bo góc hoặc đĩa tròn */}
          <circle cx="100" cy="60" r="28" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
          {/* Inner ring */}
          <circle cx="100" cy="60" r="27" fill="#ffffff" />
          {/* Subtle shading */}
          <circle cx="100" cy="60" r="24" fill="url(#ap-shading)" opacity="0.1" />

          {/* Center LED ring (Đặc trưng AP cao cấp) */}
          <circle cx="100" cy="60" r="8" stroke={colors.primary} strokeWidth="1.5" fill="none" filter="url(#glow)" />
          <circle cx="100" cy="60" r="8" stroke="#ffffff" strokeWidth="0.5" fill="none" />

          {/* Logo hãng nhỏ đặt ở dưới */}
          <text x="100" y="80" fontFamily="sans-serif" fontSize="5" fontWeight="700" fill="#94a3b8" textAnchor="middle">{displayBrand.toUpperCase()}</text>

          {/* Defs for gradients & glow */}
          <defs>
            <radialGradient id="ap-shading" cx="100" cy="60" r="24" gradientUnits="userSpaceOnUse">
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </radialGradient>
            <filter id="glow" x="85" y="45" width="30" height="30" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      )
    }

    if (slug.includes('firewall') || slug.includes('fortigate') || slug.includes('sophos')) {
      // Thiết bị Firewall bảo mật (Màu đỏ đặc trưng hoặc hộp cứng)
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main Body */}
          <rect x="15" y="20" width="170" height="40" rx="4" fill="#3b0764" stroke={colors.primary} strokeWidth="1.5" />
          
          {/* Red accents (đặc trưng thiết bị tường lửa như Fortinet) */}
          <path d="M15 20 H70 L60 60 H15 Z" fill="#9d174d" opacity="0.3" />
          <rect x="15" y="20" width="170" height="3" fill={colors.secondary} />
          
          {/* Grid lines (Mặt trước thiết bị) */}
          <line x1="75" y1="28" x2="160" y2="28" stroke="#6b21a8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="75" y1="33" x2="160" y2="33" stroke="#6b21a8" strokeWidth="1" strokeDasharray="2 2" />
          
          {/* Status Panel (Màn hình/LED) */}
          <rect x="25" y="30" width="40" height="20" rx="2" fill="#0f172a" stroke="#581c87" strokeWidth="1" />
          
          {/* Shield/Security Icon on panel */}
          <path d="M45 35 C45 35 48 36 51 35 C51 38 51 43 45 46 C39 43 39 38 39 35 C42 36 45 35 45 35 Z" fill={colors.secondary} opacity="0.8" />
          <text x="32" y="47" fontFamily="monospace" fontSize="5" fontWeight="bold" fill="#10b981">SECURE</text>

          {/* LAN/WAN Interfaces */}
          {Array.from({ length: 4 }).map((_, i) => {
            const x = 145 + i * 9
            const led = i === 0 || i === 1
            return (
              <g key={`fw-port-${i}`}>
                <rect x={x} y={42} width="7" height="6" rx="0.5" fill="#020617" stroke="#6b21a8" strokeWidth="0.5" />
                <circle cx={x + 3.5} cy={39} r="0.7" fill={led ? '#10b981' : '#475569'} />
              </g>
            )
          })}
          
          <text x="145" y="53" fontFamily="sans-serif" fontSize="3.5" fill="#a78bfa">WAN</text>
          <text x="154" y="53" fontFamily="sans-serif" fontSize="3.5" fill="#a78bfa">LAN1</text>
          <text x="163" y="53" fontFamily="sans-serif" fontSize="3.5" fill="#a78bfa">LAN2</text>
          <text x="172" y="53" fontFamily="sans-serif" fontSize="3.5" fill="#a78bfa">DMZ</text>

          {/* Logo brand */}
          <text x="80" y="47" fontFamily="sans-serif" fontSize="8" fontWeight="800" fill="#f3e8ff" letterSpacing="0.05em">{displayBrand.toUpperCase()}</text>

          {/* System LEDs */}
          <circle cx="75" cy="45" r="0.8" fill="#10b981" />
          <circle cx="75" cy="49" r="0.8" fill="#10b981" />
        </svg>
      )
    }

    if (slug.includes('router') || slug.includes('draytek') || slug.includes('mikrotik')) {
      // Thiết bị Router chuyên dụng có Ăng ten
      return (
        <svg viewBox="0 0 200 90" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Antennas (Ăng-ten phía sau) */}
          <line x1="45" y1="40" x2="25" y2="10" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="155" y1="40" x2="175" y2="10" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="100" y1="40" x2="100" y2="8" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

          {/* Main Body */}
          <rect x="25" y="40" width="150" height="35" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Front Panel Grid */}
          <rect x="35" y="46" width="130" height="23" rx="1.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />

          {/* Brand */}
          <text x="42" y="60" fontFamily="sans-serif" fontSize="7" fontWeight="800" fill="#cbd5e1">{displayBrand.toUpperCase()}</text>

          {/* Interface status LED row */}
          {Array.from({ length: 6 }).map((_, i) => {
            const x = 110 + i * 8
            const active = i !== 3 && i !== 5
            return (
              <g key={`rt-led-${i}`}>
                <circle cx={x} cy={53} r="1.2" fill={active ? '#10b981' : '#334155'} />
                <rect x={x - 2} y={58} width="4" height="6" rx="0.5" fill="#1e293b" />
                <text x={x} y={63} fontFamily="sans-serif" fontSize="4.5" fill="#64748b" textAnchor="middle">{i + 1}</text>
              </g>
            )
          })}
          
          {/* Signal Indicator */}
          <path d="M92 50 A 2 2 0 0 1 95 53" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M90 48 A 4 4 0 0 1 97 53" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M88 46 A 6 6 0 0 1 99 53" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="97" cy="53" r="0.8" fill="#10b981" />
        </svg>
      )
    }

    if (slug.includes('nas') || slug.includes('luu-tru') || slug.includes('server') || slug.includes('o-cung')) {
      // Thiết bị NAS / Server lưu trữ
      return (
        <svg viewBox="0 0 200 100" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* NAS Chassis (Thân đứng mini-tower) */}
          <rect x="55" y="10" width="90" height="80" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          
          {/* Front Drive Bays (Khay ổ đĩa ổ cứng) */}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = 18 + i * 15
            const active = i !== 3
            return (
              <g key={`bay-${i}`}>
                {/* Bay drawer outline */}
                <rect x="63" y={y} width="74" height="11" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                {/* Release latch button */}
                <rect x="127" y={y + 2} width="8" height="7" rx="0.5" fill="#0f172a" />
                {/* Activity LED */}
                <circle cx="68" cy={y + 5.5} r="1" fill={active ? '#10b981' : '#ef4444'} />
                {/* Disk slots handle lines */}
                <line x1="75" y1={y + 5.5} x2="115" y2={y + 5.5} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
              </g>
            )
          })}

          {/* Power Button */}
          <circle cx="100" cy="81" r="3" fill="#1e293b" stroke="#00d8ff" strokeWidth="1" />
          <circle cx="100" cy="81" r="1.2" fill="#00d8ff" />
          <text x="107" y="83" fontFamily="sans-serif" fontSize="5.5" fontWeight="bold" fill="#64748b">POWER</text>
        </svg>
      )
    }

    if (slug.includes('module') || slug.includes('quang') || slug.includes('phu-kien') || slug.includes('cap') || slug.includes('sfp')) {
      // Phụ kiện / Module quang SFP
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Metallic SFP Body */}
          <path d="M 30 25 H 145 L 155 35 H 170 V 45 H 155 L 145 55 H 30 Z" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
          {/* Metal gloss lines */}
          <line x1="40" y1="30" x2="135" y2="30" stroke="#475569" strokeWidth="1" />
          <line x1="40" y1="50" x2="135" y2="50" stroke="#475569" strokeWidth="1" />

          {/* Golden connector pins on the left */}
          <rect x="20" y="28" width="10" height="24" rx="0.5" fill="#eab308" />
          <line x1="22" y1="28" x2="22" y2="52" stroke="#854d0e" strokeWidth="0.5" />
          <line x1="25" y1="28" x2="25" y2="52" stroke="#854d0e" strokeWidth="0.5" />
          <line x1="28" y1="28" x2="28" y2="52" stroke="#854d0e" strokeWidth="0.5" />

          {/* Plastic pull-tab handle on the right */}
          <path d="M 170 30 H 180 V 50 H 170 Z" fill={colors.primary} />
          <path d="M 180 32 C 185 32 188 35 188 40 C 188 45 185 48 180 48" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Optical LC Duplex sockets */}
          <rect x="145" y="32" width="12" height="16" rx="1" fill="#0f172a" />
          <circle cx="151" cy="36" r="1.5" fill="#f43f5e" />
          <circle cx="151" cy="44" r="1.5" fill="#10b981" />

          {/* Text/Specs engraving */}
          <text x="60" y="42" fontFamily="monospace" fontSize="6.5" fontWeight="bold" fill="#94a3b8">{displayBrand} SFP+</text>
          <text x="60" y="49" fontFamily="monospace" fontSize="4.5" fill="#64748b">10G SR 850nm Duplex</text>
        </svg>
      )
    }

    // Default icon (Generic Hardware Concept)
    return (
      <svg viewBox="0 0 200 100" className="w-full h-full opacity-75" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="50" r="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <path d="M100 35 L113 58 L87 58 Z" fill="none" stroke={colors.secondary} strokeWidth="1.5" />
        <circle cx="100" cy="50" r="10" stroke={colors.primary} strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="50" r="4" fill={colors.secondary} />
        <circle cx="100" cy="50" r="38" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="138" cy="50" r="3" fill={colors.primary} />
        <circle cx="62" cy="50" r="3" fill="#10b981" />
      </svg>
    )
  }

  return (
    <div 
      className={`relative w-full h-full flex flex-col items-center justify-between p-4 overflow-hidden rounded-xl border border-slate-800 ${className}`}
      style={{ 
        background: colors.bgGradient,
        aspectRatio: '4/3',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      {/* Top Banner (Brand Badge) */}
      <div className="w-full flex justify-between items-center z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span 
          className="font-mono text-xs tracking-wider font-extrabold px-2.5 py-0.5 rounded-full"
          style={{ 
            color: colors.textColor, 
            backgroundColor: `${colors.primary}25`,
            border: `1px solid ${colors.primary}40`,
            fontSize: '10px',
            textTransform: 'uppercase',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '12px'
          }}
        >
          {displayBrand}
        </span>
        <span 
          className="text-slate-400 font-mono" 
          style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '0.05em', color: '#94a3b8' }}
        >
          TECH CATALOG
        </span>
      </div>

      {/* SVG Hardware Render - Center Container */}
      <div 
        className="w-full flex items-center justify-center flex-1 my-2"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flex: 1, 
          width: '100%', 
          maxHeight: '65%' 
        }}
      >
        {renderHardwareSvg()}
      </div>

      {/* Bottom Technical Spec Label */}
      <div className="w-full text-center z-10" style={{ width: '100%', textAlign: 'center' }}>
        <p 
          className="font-sans font-semibold truncate px-2"
          style={{ 
            color: '#94a3b8', 
            fontSize: '11px', 
            margin: 0,
            opacity: 0.8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {name}
        </p>
      </div>

      {/* Subtle background grids to make it look premium */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          opacity: 0.5,
          pointerEvents: 'none'
        }}
      />
    </div>
  )
}
