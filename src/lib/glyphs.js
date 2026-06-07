// ═══════════════════════════════════════════════
//  GLYPH DICTIONARY v2 — With unlock system
//  4 new locked glyphs added at the bottom.
//  Unlock rules defined in UNLOCK_RECIPES.
// ═══════════════════════════════════════════════

export const RING_ZONES = {
  CENTER: 'center',
  INNER:  'inner',
  OUTER:  'outer',
}

export const GLYPH_TYPES = {
  PRIMARY:  'primary',
  MODIFIER: 'modifier',
}

export const CONFLICTS = [
  ['fire',  'water'],
  ['light', 'shadow'],
]

// ── UNLOCK RECIPES ───────────────────────────────
// Each recipe defines which glyphs must ALL be
// present in the circle to unlock a new glyph.
// Order doesn't matter — just presence.

export const UNLOCK_RECIPES = [
  {
    unlocksId:   'cinis',
    requires:    ['fire', 'time'],
    hint:        'Fire and Time, held together...',
  },
  {
    unlocksId:   'tempest',
    requires:    ['water', 'wind'],
    hint:        'Water and Wind, in the same breath...',
  },
  {
    unlocksId:   'crepus',
    requires:    ['light', 'shadow'],
    hint:        'Light and Shadow, though they war...',
  },
  {
    unlocksId:   'nexus',
    requires:    ['duration', 'focus', 'spread', 'anchor'],
    hint:        'All four modifiers, perfectly balanced...',
  },
]

// ── THE GLYPHS ───────────────────────────────────

export const GLYPHS = [

  // ── PRIMARY / ELEMENT GLYPHS (7 unlocked) ──

  {
    id: 'fire',
    name: 'Ignis',
    type: GLYPH_TYPES.PRIMARY,
    element: 'fire',
    color: '#e8593c',
    effect: 'Calls forth heat and burning light',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 2C15 2 21 9 19 15C22 11 21 6 21 6C25 11 26 19 20 24C18 27 17 29 15 29C13 27 12 25 10 24C4 19 5 11 9 6C9 6 8 11 12 15C10 9 15 2 15 2Z"
        stroke="#e8593c" stroke-width="1" fill="rgba(232,89,60,0.1)"/>
      <circle cx="15" cy="21" r="3" stroke="#e8593c" stroke-width="0.8" fill="rgba(232,89,60,0.15)"/>
    </svg>`,
  },

  {
    id: 'water',
    name: 'Aqua',
    type: GLYPH_TYPES.PRIMARY,
    element: 'water',
    color: '#3b8bd4',
    effect: 'Summons flowing water and tides',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 3C15 3 6 12 6 20C6 25.5 10 28 15 28C20 28 24 25.5 24 20C24 12 15 3 15 3Z"
        stroke="#3b8bd4" stroke-width="1" fill="rgba(59,139,212,0.1)"/>
      <path d="M10 20C10 20 12 17 15 18C18 19 20 16 20 16"
        stroke="#3b8bd4" stroke-width="0.8" opacity="0.5"/>
    </svg>`,
  },

  {
    id: 'wind',
    name: 'Ventus',
    type: GLYPH_TYPES.PRIMARY,
    element: 'wind',
    color: '#5cb85c',
    effect: 'Shapes and redirects air currents',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12C5 12 13 10 18 14C23 18 27 12 27 12" stroke="#5cb85c" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M5 18C5 18 11 16 16 20C21 24 27 18 27 18" stroke="#5cb85c" stroke-width="1.1" stroke-linecap="round" opacity="0.65"/>
      <circle cx="25" cy="10" r="2.5" stroke="#5cb85c" stroke-width="0.8" fill="rgba(92,184,92,0.1)"/>
    </svg>`,
  },

  {
    id: 'earth',
    name: 'Terra',
    type: GLYPH_TYPES.PRIMARY,
    element: 'earth',
    color: '#a0783c',
    effect: 'Commands stone, soil and growth',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="15,3 27,24 3,24" stroke="#a0783c" stroke-width="1" fill="rgba(160,120,60,0.1)"/>
      <line x1="15" y1="3" x2="15" y2="24" stroke="#a0783c" stroke-width="0.7" opacity="0.4"/>
      <path d="M9 18L15 10L21 18" stroke="#a0783c" stroke-width="0.7" fill="none" opacity="0.4"/>
    </svg>`,
  },

  {
    id: 'light',
    name: 'Lux',
    type: GLYPH_TYPES.PRIMARY,
    element: 'light',
    color: '#c9a84c',
    effect: 'Radiates illumination and revelation',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="6" stroke="#c9a84c" stroke-width="1" fill="rgba(201,168,76,0.08)"/>
      <line x1="15" y1="3" x2="15" y2="7"   stroke="#c9a84c" stroke-width="1.1" stroke-linecap="round"/>
      <line x1="15" y1="23" x2="15" y2="27"  stroke="#c9a84c" stroke-width="1.1" stroke-linecap="round"/>
      <line x1="3"  y1="15" x2="7"  y2="15"  stroke="#c9a84c" stroke-width="1.1" stroke-linecap="round"/>
      <line x1="23" y1="15" x2="27" y2="15"  stroke="#c9a84c" stroke-width="1.1" stroke-linecap="round"/>
      <line x1="6"  y1="6"  x2="9"  y2="9"   stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
      <line x1="21" y1="21" x2="24" y2="24"  stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
      <line x1="24" y1="6"  x2="21" y2="9"   stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
      <line x1="9"  y1="21" x2="6"  y2="24"  stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
    </svg>`,
  },

  {
    id: 'shadow',
    name: 'Umbra',
    type: GLYPH_TYPES.PRIMARY,
    element: 'shadow',
    color: '#9b59b6',
    effect: 'Weaves darkness and concealment',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="11" stroke="#9b59b6" stroke-width="1" fill="rgba(155,89,182,0.08)"/>
      <path d="M15 4C10.5 4 7 8 7 14C7 20 10.5 24 15 24"
        stroke="#9b59b6" stroke-width="1" fill="rgba(155,89,182,0.18)"/>
      <circle cx="12" cy="12" r="1.8" fill="#9b59b6" opacity="0.4"/>
    </svg>`,
  },

  {
    id: 'time',
    name: 'Hora',
    type: GLYPH_TYPES.PRIMARY,
    element: 'time',
    color: '#4ecdc4',
    effect: 'Bends the flow of moments',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="11" stroke="#4ecdc4" stroke-width="1" fill="rgba(78,205,196,0.07)"/>
      <line x1="15" y1="7"  x2="15" y2="15" stroke="#4ecdc4" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="15" y1="15" x2="21" y2="12" stroke="#4ecdc4" stroke-width="1"   stroke-linecap="round"/>
      <circle cx="15" cy="15" r="1.8" fill="#4ecdc4"/>
      <path d="M22 6L24 3L21 5" stroke="#4ecdc4" stroke-width="0.9" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },

  // ── MODIFIER GLYPHS (4 unlocked) ──

  {
    id: 'duration',
    name: 'Mora',
    type: GLYPH_TYPES.MODIFIER,
    element: 'modifier',
    color: '#c9a84c',
    effect: 'Extends the spell through time',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="12" width="18" height="7" rx="2" stroke="#c9a84c" stroke-width="0.9" fill="rgba(201,168,76,0.07)"/>
      <line x1="10" y1="12" x2="10" y2="7"  stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="20" y1="12" x2="20" y2="7"  stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="6"  y1="19" x2="3"  y2="24" stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round" opacity="0.5"/>
      <line x1="24" y1="19" x2="27" y2="24" stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },

  {
    id: 'focus',
    name: 'Acus',
    type: GLYPH_TYPES.MODIFIER,
    element: 'modifier',
    color: '#c9a84c',
    effect: 'Concentrates the effect to a point',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="11" stroke="#c9a84c" stroke-width="0.8" fill="none" stroke-dasharray="3 4"/>
      <circle cx="15" cy="15" r="5"  stroke="#c9a84c" stroke-width="0.9" fill="rgba(201,168,76,0.07)"/>
      <circle cx="15" cy="15" r="1.8" fill="#c9a84c"/>
      <line x1="15" y1="4"  x2="15" y2="10" stroke="#c9a84c" stroke-width="0.7"/>
      <line x1="15" y1="20" x2="15" y2="26" stroke="#c9a84c" stroke-width="0.7"/>
      <line x1="4"  y1="15" x2="10" y2="15" stroke="#c9a84c" stroke-width="0.7"/>
      <line x1="20" y1="15" x2="26" y2="15" stroke="#c9a84c" stroke-width="0.7"/>
    </svg>`,
  },

  {
    id: 'spread',
    name: 'Latus',
    type: GLYPH_TYPES.MODIFIER,
    element: 'modifier',
    color: '#c9a84c',
    effect: 'Widens the area of effect',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="3" stroke="#c9a84c" stroke-width="0.9" fill="rgba(201,168,76,0.08)"/>
      <path d="M9 9L5 5M21 9L25 5M9 21L5 25M21 21L25 25" stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round"/>
      <circle cx="5"  cy="5"  r="2" stroke="#c9a84c" stroke-width="0.7" fill="none"/>
      <circle cx="25" cy="5"  r="2" stroke="#c9a84c" stroke-width="0.7" fill="none"/>
      <circle cx="5"  cy="25" r="2" stroke="#c9a84c" stroke-width="0.7" fill="none"/>
      <circle cx="25" cy="25" r="2" stroke="#c9a84c" stroke-width="0.7" fill="none"/>
    </svg>`,
  },

  {
    id: 'anchor',
    name: 'Fixum',
    type: GLYPH_TYPES.MODIFIER,
    element: 'modifier',
    color: '#c9a84c',
    effect: 'Binds the spell to a fixed point',
    unlocked: true,
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="10" r="3.5" stroke="#c9a84c" stroke-width="0.9" fill="rgba(201,168,76,0.08)"/>
      <line x1="15" y1="13.5" x2="15" y2="25" stroke="#c9a84c" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M8 20C8 20 11 26 15 26C19 26 22 20 22 20" stroke="#c9a84c" stroke-width="0.9" stroke-linecap="round" fill="none"/>
      <line x1="8" y1="10" x2="22" y2="10" stroke="#c9a84c" stroke-width="0.7" opacity="0.4"/>
    </svg>`,
  },

  // ── LOCKED / DISCOVERABLE GLYPHS ─────────────
  // unlocked: false — hidden in picker until discovered
  // discoveryLore — shown in the unlock reveal animation

  {
    id: 'cinis',
    name: 'Cinis',
    type: GLYPH_TYPES.PRIMARY,
    element: 'fire',
    color: '#ff9f43',
    effect: 'An ember suspended outside of time — burns without consuming',
    unlocked: false,
    discoveryLore: 'Fire and Time, held in the same circle — the flame neither grows nor fades. It simply persists, patient as starlight.',
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="10" stroke="#ff9f43" stroke-width="0.8" fill="rgba(255,159,67,0.06)" stroke-dasharray="2 3"/>
      <path d="M15 7C15 7 19 12 17 16C19 14 18 11 18 11C20 14 20 19 16 22C15 24 15 25 15 25C15 25 15 24 14 22C10 19 10 14 12 11C12 11 11 14 13 16C11 12 15 7 15 7Z"
        stroke="#ff9f43" stroke-width="0.9" fill="rgba(255,159,67,0.1)"/>
      <circle cx="15" cy="15" r="2.5" stroke="#ff9f43" stroke-width="0.8" fill="rgba(255,159,67,0.2)"/>
    </svg>`,
  },

  {
    id: 'tempest',
    name: 'Tempestas',
    type: GLYPH_TYPES.PRIMARY,
    element: 'wind',
    color: '#54a0ff',
    effect: 'A storm born where water and wind become one',
    unlocked: false,
    discoveryLore: 'Water and Wind, drawn together in the inner ring, ceased to be separate things. What rose from the circle was neither — it was the place where the sea ends and the sky begins.',
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 4C15 4 8 10 8 18C8 23 11 26 15 26C19 26 22 23 22 18C22 10 15 4 15 4Z"
        stroke="#54a0ff" stroke-width="0.9" fill="rgba(84,160,255,0.08)"/>
      <path d="M6 14C6 14 12 12 16 16C20 20 25 14 25 14" stroke="#54a0ff" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      <path d="M8 20C8 20 13 18 17 21" stroke="#54a0ff" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },

  {
    id: 'crepus',
    name: 'Crepusculum',
    type: GLYPH_TYPES.PRIMARY,
    element: 'light',
    color: '#a29bfe',
    effect: 'The moment between — neither light nor shadow, but the threshold itself',
    unlocked: false,
    discoveryLore: 'They say Light and Shadow cannot share a circle. They are wrong. When drawn with equal care, the two do not destroy each other — they become the hour between, when the world holds its breath.',
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="10" stroke="#a29bfe" stroke-width="0.9" fill="rgba(162,155,254,0.06)"/>
      <path d="M15 5C15 5 15 25 15 25" stroke="#a29bfe" stroke-width="0.8" opacity="0.4"/>
      <path d="M15 5C10 5 6 10 6 15C6 20 10 25 15 25" stroke="#a29bfe" stroke-width="1" fill="rgba(162,155,254,0.15)"/>
      <line x1="15" y1="3" x2="15" y2="7"  stroke="#a29bfe" stroke-width="1" stroke-linecap="round"/>
      <line x1="15" y1="23" x2="15" y2="27" stroke="#a29bfe" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },

  {
    id: 'nexus',
    name: 'Nexus',
    type: GLYPH_TYPES.MODIFIER,
    element: 'modifier',
    color: '#fd79a8',
    effect: 'The binding glyph — amplifies all modifiers in the circle simultaneously',
    unlocked: false,
    discoveryLore: 'I placed all four modifiers together expecting chaos. Instead, something quiet happened — each one began to reinforce the others, as if they had always been waiting to be in the same room.',
    svg: `<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="10" stroke="#fd79a8" stroke-width="0.8" fill="rgba(253,121,168,0.06)"/>
      <circle cx="15" cy="8"  r="2"  stroke="#fd79a8" stroke-width="0.8" fill="rgba(253,121,168,0.12)"/>
      <circle cx="15" cy="22" r="2"  stroke="#fd79a8" stroke-width="0.8" fill="rgba(253,121,168,0.12)"/>
      <circle cx="8"  cy="15" r="2"  stroke="#fd79a8" stroke-width="0.8" fill="rgba(253,121,168,0.12)"/>
      <circle cx="22" cy="15" r="2"  stroke="#fd79a8" stroke-width="0.8" fill="rgba(253,121,168,0.12)"/>
      <line x1="15" y1="10" x2="15" y2="20" stroke="#fd79a8" stroke-width="0.7" opacity="0.4"/>
      <line x1="10" y1="15" x2="20" y2="15" stroke="#fd79a8" stroke-width="0.7" opacity="0.4"/>
      <circle cx="15" cy="15" r="2.5" stroke="#fd79a8" stroke-width="0.9" fill="rgba(253,121,168,0.2)"/>
    </svg>`,
  },

]

// ── HELPER FUNCTIONS ─────────────────────────────

export function getGlyph(id) {
  return GLYPHS.find(g => g.id === id) ?? null
}

export function getUnlockedGlyphs() {
  return GLYPHS.filter(g => g.unlocked)
}

export function getPrimaryGlyphs() {
  return GLYPHS.filter(g => g.type === GLYPH_TYPES.PRIMARY && g.unlocked)
}

export function getModifierGlyphs() {
  return GLYPHS.filter(g => g.type === GLYPH_TYPES.MODIFIER && g.unlocked)
}

export function areConflicting(glyphIdA, glyphIdB) {
  return CONFLICTS.some(
    ([a, b]) => (a === glyphIdA && b === glyphIdB) ||
                (b === glyphIdA && a === glyphIdB)
  )
}

export function hasConflicts(placedGlyphIds) {
  const ids = Object.values(placedGlyphIds)
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (areConflicting(ids[i], ids[j])) return true
    }
  }
  return false
}
