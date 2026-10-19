interface PlaceholderProps {
  brand: string
  categorySlug: string
  name: string
  className?: string
}

function Ports({
  count = 12,
  x = 172,
  y = 150,
  step = 17,
}: {
  count?: number
  x?: number
  y?: number
  step?: number
}) {
  return Array.from({ length: count }, (_, index) => (
    <g key={index} transform={`translate(${x + index * step} ${y})`}>
      <rect width="12" height="14" rx="1" fill="#232326" stroke="#66666b" strokeWidth=".7" />
      <path d="M2 3h8M3 5v3m2-3v3m2-3v3m2-3v3M4 12h4" stroke="#aaa9a5" strokeWidth=".6" />
      <circle cx="3" cy="-4" r="1.2" fill={index % 4 === 0 ? '#49a37a' : '#77777c'} />
      <circle cx="9" cy="-4" r="1.2" fill="#77777c" />
    </g>
  ))
}

function Hardware({ category, brand }: { category: string; brand: string }) {
  const isWifi = /wifi|access-point/.test(category)
  const isStorage = /nas|luu-tru|server/.test(category)
  const isModule = /module|quang|phu-kien|sfp/.test(category)
  const isFirewall = /firewall/.test(category)
  const isRouter = /router/.test(category)
  if (isWifi)
    return (
      <>
        <ellipse cx="240" cy="205" rx="94" ry="9" fill="#1d1d1f" opacity=".06" />
        <ellipse cx="240" cy="159" rx="92" ry="50" fill="#d9d9dd" stroke="#a8a8ad" />
        <ellipse cx="240" cy="145" rx="92" ry="50" fill="#fafafc" stroke="#b6b6bd" />
        <ellipse cx="240" cy="142" rx="83" ry="43" stroke="#e2e2e6" />
        <ellipse cx="240" cy="142" rx="22" ry="12" stroke="#7d7d84" strokeWidth="1.2" />
        <ellipse cx="240" cy="142" rx="18" ry="9" stroke="#ececf0" />
        <path d="M222 157h36" stroke="#0066cc" strokeWidth="1.4" strokeLinecap="round" />
        <text x="240" y="178" fill="#8b8b91" fontSize="8" textAnchor="middle" letterSpacing="1.3">
          {brand}
        </text>
      </>
    )
  if (isStorage)
    return (
      <>
        <ellipse cx="243" cy="231" rx="80" ry="8" fill="#1d1d1f" opacity=".08" />
        <path d="m172 66 29-17h119l-29 17Z" fill="#66666a" stroke="#8a8a8f" />
        <path d="m291 66 29-17v158l-29 18Z" fill="#303034" stroke="#66666b" />
        <rect x="172" y="66" width="119" height="159" rx="3" fill="#414145" stroke="#77777d" />
        {[0, 1, 2, 3].map((index) => (
          <g key={index}>
            <rect
              x={184 + index * 23}
              y="86"
              width="19"
              height="110"
              rx="2"
              fill="#303034"
              stroke="#626268"
            />
            <path d={`M${190 + index * 23} 104v66`} stroke="#76767d" />
            <rect x={189 + index * 23} y="178" width="9" height="8" rx="1" fill="#222225" />
            <circle cx={194 + index * 23} cy="80" r="1.2" fill="#49a37a" />
          </g>
        ))}
        <circle cx="278" cy="211" r="3.5" fill="#252529" stroke="#a3a3a8" />
        <text x="182" y="213" fill="#c0c0c5" fontSize="7" letterSpacing="1">
          {brand}
        </text>
      </>
    )
  if (isModule)
    return (
      <>
        <ellipse cx="242" cy="214" rx="141" ry="7" fill="#1d1d1f" opacity=".07" />
        <path d="m110 141 26-20h209l-25 20Z" fill="#e5e5e8" stroke="#a3a3aa" />
        <path d="m320 141 25-20v54l-25 19Z" fill="#89898f" stroke="#737379" />
        <rect x="110" y="141" width="210" height="53" rx="2" fill="#c4c4c9" stroke="#8c8c93" />
        <rect x="88" y="151" width="22" height="32" fill="#bab7a9" stroke="#939087" />
        {[0, 1, 2, 3, 4].map((index) => (
          <path key={index} d={`M${91 + index * 4} 153v27`} stroke="#777568" strokeWidth="1" />
        ))}
        <rect x="274" y="149" width="42" height="36" rx="1" fill="#3e3e43" />
        <rect x="279" y="156" width="13" height="22" fill="#1d1d1f" stroke="#77777e" />
        <rect x="298" y="156" width="13" height="22" fill="#1d1d1f" stroke="#77777e" />
        <path d="M321 151h30v40h-30" stroke="#5d5d63" strokeWidth="4" />
        <text x="126" y="162" fill="#57575d" fontSize="8" letterSpacing="1.2">
          {brand}
        </text>
        <path d="M126 170h105m-105 5h86m-86 5h69" stroke="#939399" strokeWidth="1" />
      </>
    )
  return (
    <>
      <ellipse cx="244" cy="206" rx="192" ry="8" fill="#1d1d1f" opacity=".07" />
      <path
        d="m51 124 30-39h340l-30 39Z"
        fill={isFirewall ? '#e1e1e5' : '#bdbdc2'}
        stroke="#939399"
      />
      <path
        d="m391 124 30-39v66l-30 38Z"
        fill={isFirewall ? '#aaaab1' : '#55555c'}
        stroke="#898990"
      />
      <rect
        x="51"
        y="124"
        width="340"
        height="65"
        rx="2.5"
        fill={isFirewall ? '#f2f2f4' : '#85858d'}
        stroke="#73737c"
      />
      <rect
        x="56"
        y="131"
        width="330"
        height="49"
        rx="1"
        fill={isFirewall ? '#e4e4e8' : '#686870'}
        stroke={isFirewall ? '#c7c7cd' : '#96969d'}
        strokeWidth=".6"
      />
      <path
        d="M82 91h270m-274 5h270m-274 5h270m-274 5h270"
        stroke={isFirewall ? '#c7c7cd' : '#a2a2a9'}
        strokeWidth=".7"
      />
      <rect x="39" y="121" width="12" height="71" rx="2" fill="#a6a6ad" stroke="#7b7b83" />
      <rect x="391" y="121" width="12" height="71" rx="2" fill="#a6a6ad" stroke="#7b7b83" />
      {[45, 397].map((x) => (
        <g key={x}>
          <circle cx={x} cy="131" r="2" fill="#53535a" />
          <circle cx={x} cy="182" r="2" fill="#53535a" />
        </g>
      ))}
      <text
        x="67"
        y="150"
        fill={isFirewall ? '#444449' : '#f5f5f7'}
        fontSize="8"
        letterSpacing="1.1"
      >
        {brand}
      </text>
      <path d="M67 157h63" stroke={isFirewall ? '#b0b0b6' : '#a6a6ad'} />
      <circle cx="71" cy="169" r="1.6" fill="#49a37a" />
      <circle cx="79" cy="169" r="1.6" fill="#aaaab0" />
      <Ports
        count={isRouter ? 6 : isFirewall ? 8 : 12}
        x={isRouter ? 206 : isFirewall ? 186 : 157}
        step={isRouter ? 24 : isFirewall ? 23 : 17}
        y={150}
      />
      <path d="M348 146h23v23h-23Z" fill="#414147" stroke="#9999a1" />
      <path d="M352 151h15v5h-15Zm0 10h15v5h-15Z" stroke="#c0c0c7" strokeWidth=".7" />
      <text
        x="158"
        y="176"
        fill={isFirewall ? '#74747b' : '#d2d2d8'}
        fontSize="4.5"
        letterSpacing="1.1"
      >
        NETWORK INTERFACES
      </text>
    </>
  )
}

/** An illustrative industrial drawing; it does not assert a model's port count. */
export function ProductPlaceholder({
  brand,
  categorySlug,
  name,
  className = '',
}: PlaceholderProps) {
  return (
    <div
      className={`product-schematic ${className}`}
      role="img"
      aria-label={`Sơ đồ minh họa dòng thiết bị ${name}`}
    >
      <svg viewBox="0 0 480 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <Hardware
          category={categorySlug.toLowerCase()}
          brand={(brand.trim() || 'INTECH').toUpperCase().slice(0, 15)}
        />
        <path d="M38 242h404M38 237v10m404-10v10" stroke="#c8c8ce" strokeWidth=".7" />
        <text x="240" y="260" textAnchor="middle" fill="#8a8a91" fontSize="7" letterSpacing="1.8">
          HARDWARE SCHEMATIC · MINH HỌA DÒNG THIẾT BỊ
        </text>
      </svg>
    </div>
  )
}
