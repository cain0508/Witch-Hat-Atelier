import React, { useState, useEffect } from 'react';
import { GLYPHS } from '@/lib/glyphs';

const RING_COLORS = { 
  center: '#f0c040',
  inner:  '#40c8a0',
  outer:  '#e05050' 
};

export default function GlyphSlot({ 
  slot, 
  placedGlyphId, 
  selectedGlyph, 
  onPlace 
}) {
  const [justPlaced, setJustPlaced] = useState(false);
  const [showIcon, setShowIcon] = useState(!!placedGlyphId);

  // Trigger animation when a new glyph is placed
  useEffect(() => {
    if (placedGlyphId && !showIcon) {
      setJustPlaced(true);
      // Wait for flicker before showing icon
      const timer = setTimeout(() => {
        setShowIcon(true);
      }, 300); // 300ms flicker
      return () => clearTimeout(timer);
    } else if (!placedGlyphId) {
      setShowIcon(false);
      setJustPlaced(false);
    }
  }, [placedGlyphId]);

  const color = RING_COLORS[slot.ring] ?? '#f0c040';
  const isFilled = !!placedGlyphId;
  const glyph = isFilled ? GLYPHS.find(g => g.id === placedGlyphId) : null;

  // Interaction state
  const isHoveringEmpty = !isFilled;
  const cursor = isHoveringEmpty && selectedGlyph ? 'pointer' : 'default';

  return (
    <div 
      className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group"
      style={{
        left: `${(slot.x / 360) * 100}%`,
        top: `${(slot.y / 360) * 100}%`,
        width: `${(slot.size / 360) * 100}%`,
        height: `${(slot.size / 360) * 100}%`,
        cursor,
        zIndex: isFilled ? 10 : 5,
      }}
      onClick={() => {
        if (!isFilled && selectedGlyph) {
          onPlace(slot.id);
        }
      }}
    >
      {/* Base Ring / Background */}
      <div 
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          border: isFilled ? `1.5px solid ${glyph.color}` : `1.5px solid ${color}`,
          backgroundColor: isFilled ? 'rgba(15, 10, 25, 0.95)' : 'transparent',
          boxShadow: isFilled ? `0 0 12px ${glyph.color}60, inset 0 0 8px ${glyph.color}40` : 'none'
        }}
      />

      {/* Center Dot (Empty State or Flickering State) */}
      {(!showIcon) && (
        <div 
          className="absolute rounded-full"
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
            animation: justPlaced ? 'dotFlicker 0.15s ease-in-out infinite' : 'none'
          }}
        />
      )}

      {/* Glyph Icon (Animated in) */}
      {showIcon && glyph && (
        <div 
          className="w-[80%] h-[80%] flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{
            animation: 'glyphDrop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}
          dangerouslySetInnerHTML={{ __html: glyph.svg }}
        />
      )}
    </div>
  );
}
