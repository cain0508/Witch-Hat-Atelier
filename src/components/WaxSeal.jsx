import React from 'react';

// Generates an SVG path for a scalloped circle (wax seal shape)
function getScallopedPath(cx, cy, radius, bumps, bumpDepth) {
  let d = "";
  for (let i = 0; i < bumps; i++) {
    const angle1 = (i * 2 * Math.PI) / bumps;
    const angle2 = ((i + 1) * 2 * Math.PI) / bumps;
    const midAngle = (angle1 + angle2) / 2;

    const x1 = (cx + radius * Math.cos(angle1)).toFixed(3);
    const y1 = (cy + radius * Math.sin(angle1)).toFixed(3);
    const x2 = (cx + radius * Math.cos(angle2)).toFixed(3);
    const y2 = (cy + radius * Math.sin(angle2)).toFixed(3);

    const cx1 = (cx + (radius + bumpDepth) * Math.cos(midAngle)).toFixed(3);
    const cy1 = (cy + (radius + bumpDepth) * Math.sin(midAngle)).toFixed(3);

    if (i === 0) d += `M ${x1} ${y1} `;
    d += `Q ${cx1} ${cy1} ${x2} ${y2} `;
  }
  return d + "Z";
}

export default function WaxSeal({ color = '#8b1a1a', iconSvg, glowColor, className = '', size = 64, isLocked = false, isDark = false }) {
  const path = getScallopedPath(50, 50, 36, 12, 10);
  const sealId = React.useId().replace(/:/g, "");

  // If locked, use a muddy brown/grey
  const baseColor = isLocked ? '#3a2500' : color;
  const shadowOpacity = isDark ? 0.8 : 0.6;
  const highlightOpacity = isDark ? 0.1 : 0.3;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      
      {/* Outer Glow */}
      {glowColor && !isLocked && (
        <div 
          className="absolute inset-0 rounded-full" 
          style={{ 
            boxShadow: `0 0 20px 5px ${glowColor}, inset 0 0 10px ${glowColor}`, 
            opacity: 0.6 
          }} 
        />
      )}

      {/* SVG Seal */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
        <defs>
          <radialGradient id={`grad-${sealId}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={highlightOpacity} />
            <stop offset="40%" stopColor={baseColor} stopOpacity="1" />
            <stop offset="85%" stopColor="#000000" stopOpacity={shadowOpacity} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        
        {/* Base scalloped shape */}
        <path d={path} fill={`url(#grad-${sealId})`} stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
        
        {/* Inner embossed ring */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="26.5" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
      </svg>
      
      {/* Icon */}
      <div 
        className="relative z-10 flex items-center justify-center" 
        style={{ 
          width: '45%', 
          height: '45%', 
          color: isLocked ? 'rgba(0,0,0,0.5)' : '#f5e6c8',
          filter: isLocked ? 'none' : 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' 
        }}
      >
        {isLocked ? (
          <span className="font-cinzel text-[24px] font-bold">?</span>
        ) : iconSvg ? (
          <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: iconSvg }} />
        ) : null}
      </div>
    </div>
  );
}
