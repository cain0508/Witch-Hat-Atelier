// ═══════════════════════════════════════════════
//  SHAPES — Blueprint shape dictionary
//  Single source of truth for all 9 shapes, slot roles,
//  node groups, connectors, and unlock validation.
// ═══════════════════════════════════════════════

// Canvas center and radius constants
const CX = 200  // canvas center x
const CY = 200  // canvas center y

// Shape tiers
export const SHAPE_TIERS = {
  BASE:     'base',      // available from start
  BASIC:    'basic',     // available from start
  ADVANCED: 'advanced',  // unlock after 10 spells
  MASTER:   'master',    // unlock after 2 hidden glyphs
  SPECIAL:  'special',   // unlock after 2 hidden glyphs
  RARE:     'rare',      // unlock after legendary spell or fire+water unstable
}

// Connector types between shapes
export const CONNECTORS = {
  FLOW:   'flow',
  MIRROR: 'mirror',
  GATE:   'gate',
  DRAIN:  'drain',
  OPPOSE: 'oppose',
}

export const CONNECTOR_TYPES = [
  {
    id:       CONNECTORS.FLOW,
    name:     'Flow',
    desc:     'Primary output feeds secondary — amplify chain',
    color:    '#4ecdc4',
    penalty:  'Messy connector line = energy loss between shapes',
  },
  {
    id:       CONNECTORS.MIRROR,
    name:     'Mirror',
    desc:     'Both shapes reinforce each other — harmonic resonance',
    color:    '#c9a84c',
    penalty:  'Both shapes must be neat for full effect',
  },
  {
    id:       CONNECTORS.GATE,
    name:     'Gate',
    desc:     'Secondary activates only when primary completes',
    color:    '#9b59b6',
    penalty:  'Line precision determines timing accuracy',
  },
  {
    id:       CONNECTORS.DRAIN,
    name:     'Drain',
    desc:     'Secondary draws power from primary — sacrifice mechanic',
    color:    '#e8593c',
    penalty:  'Shorter connector = less power lost in transfer',
  },
  {
    id:       CONNECTORS.OPPOSE,
    name:     'Oppose',
    desc:     'Shapes fight — tension, unstable but powerful',
    color:    '#fd79a8',
    penalty:  'Any sloppiness = full blueprint collapse',
  },
]

// Slot Roles
export const SLOT_ROLES = {
  CORE:      'core',
  AMPLIFIER: 'amplifier',
  SUPPORT:   'support',
  BRIDGE:    'bridge',
  ANCHOR:    'anchor',
  CHANNEL:   'channel',
}

// Node Groups
export const NODE_GROUPS = {
  ACE: 'ace',
  BFD: 'bfd',
  ALL: 'all',
}

// Helper — generate a point on a circle
function pt(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: Math.round(cx + r * Math.cos(rad)), y: Math.round(cy + r * Math.sin(rad)) }
}

// ── THE 9 SHAPES ────────────────────────────────
export const SHAPES = [
  // 1. Circle
  {
    id:        'circle',
    name:      'Circle',
    subtitle:  'The Balanced Core',
    tier:      SHAPE_TIERS.BASE,
    unlocked:  true,
    affinity:  ['water', 'time'],
    affinityBonus: '+20% duration when Water or Time anchors the center',
    quality:   'Balanced, sustained, versatile',
    special:   'Clockwise glyph placement = power increases. Anticlockwise = balance.',
    color:     '#4ecdc4',
    internalRules: [
      'Clockwise placement order increases spell power',
      'Anticlockwise placement order balances between elements',
      'Opposite elements at inner nodes support each other',
      'Opposite elements at outer slots collide and destabilise',
    ],
    slots: [
      { id: 'c0', label: 'Center', role: SLOT_ROLES.CORE,      group: NODE_GROUPS.ALL, x: CX, y: CY, size: 50 },
      { id: 'i0', label: 'A',      role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 80, 0), size: 40 },
      { id: 'i1', label: 'B',      role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 80, 90), size: 40 },
      { id: 'i2', label: 'C',      role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 80, 180), size: 40 },
      { id: 'i3', label: 'D',      role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 80, 270), size: 40 },
      { id: 'o0', label: 'Outer',  role: SLOT_ROLES.CHANNEL,   group: NODE_GROUPS.ALL, ...pt(CX, CY, 145, 0), size: 36 },
    ],
    svgPath: `<circle cx="200" cy="200" r="160" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 6"/>
              <circle cx="200" cy="200" r="90"  fill="none" stroke="currentColor" stroke-width="1"   stroke-dasharray="3 5" opacity="0.6"/>
              <circle cx="200" cy="200" r="30"  fill="none" stroke="currentColor" stroke-width="1"   opacity="0.8"/>`,
  },

  // 2. Triangle
  {
    id:        'triangle',
    name:      'Triangle',
    subtitle:  'Core Amplifier',
    tier:      SHAPE_TIERS.BASIC,
    unlocked:  true,
    affinity:  ['fire', 'light'],
    affinityBonus: '+20% intensity when Fire or Light is the target element',
    quality:   'High intensity, focused, amplified burst',
    special:   '3 corner amplifiers boost the center element. Midpoints shape the amplification.',
    color:     '#e8593c',
    internalRules: [
      'Center = target element, defines the spell identity',
      'Corner slots amplify the center element directly',
      'Midpoint slots modify and shape the amplification',
      'All 3 corners same element = maximum amplification',
      'Mixed corners = nuanced layered spell effect',
    ],
    slots: [
      { id: 'c0', label: 'Center',  role: SLOT_ROLES.CORE,      group: NODE_GROUPS.ALL, x: CX, y: CY, size: 48 },
      { id: 't0', label: 'Corner A',role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.ACE, ...pt(CX, CY, 140, 0), size: 44 },
      { id: 't1', label: 'Corner B',role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.ACE, ...pt(CX, CY, 140, 120), size: 44 },
      { id: 't2', label: 'Corner C',role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.ACE, ...pt(CX, CY, 140, 240), size: 44 },
      { id: 'm0', label: 'Mid 1',   role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 100, 60), size: 38 },
      { id: 'm1', label: 'Mid 2',   role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 100, 300), size: 38 },
    ],
    svgPath: `<polygon points="${pt(CX,CY,160,0).x},${pt(CX,CY,160,0).y} ${pt(CX,CY,160,120).x},${pt(CX,CY,160,120).y} ${pt(CX,CY,160,240).x},${pt(CX,CY,160,240).y}"
               fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  // 3. Square
  {
    id:        'square',
    name:      'Square',
    subtitle:  'The Warden',
    tier:      SHAPE_TIERS.BASIC,
    unlocked:  true,
    affinity:  ['earth', 'water'],
    affinityBonus: '+20% stability when Earth anchors any corner',
    quality:   'Maximum stability, containment, unbreakable protection',
    special:   'Only shape that can CONTAIN an unstable spell without collapse.',
    color:     '#a0783c',
    internalRules: [
      'Opposite corners must match element family or binding weakens',
      'All 4 corners filled = full ward activated',
      'Midpoints bind the corner elements together',
      'Unstable combos inside a Square are contained, not catastrophic',
    ],
    slots: [
      { id: 's0', label: 'Corner TL', role: SLOT_ROLES.ANCHOR,    group: NODE_GROUPS.ACE, ...pt(CX, CY, 130, 315), size: 44 },
      { id: 's1', label: 'Corner TR', role: SLOT_ROLES.ANCHOR,    group: NODE_GROUPS.ACE, ...pt(CX, CY, 130, 45), size: 44 },
      { id: 's2', label: 'Corner BR', role: SLOT_ROLES.ANCHOR,    group: NODE_GROUPS.ACE, ...pt(CX, CY, 130, 135), size: 44 },
      { id: 's3', label: 'Corner BL', role: SLOT_ROLES.ANCHOR,    group: NODE_GROUPS.ACE, ...pt(CX, CY, 130, 225), size: 44 },
      { id: 'm0', label: 'Mid T',     role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 130, 0), size: 38 },
      { id: 'm1', label: 'Mid B',     role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 130, 180), size: 38 },
    ],
    svgPath: `<rect x="${CX-145}" y="${CY-145}" width="290" height="290" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  // 4. Pentagon
  {
    id:        'pentagon',
    name:      'Pentagon',
    subtitle:  'The Recursive Engine',
    tier:      SHAPE_TIERS.ADVANCED,
    unlocked:  false,
    unlockCondition: 'Unlock after casting 10 spells',
    affinity:  ['time', 'shadow'],
    affinityBonus: '+20% recursion when Time is placed at F (center)',
    quality:   'Self-reinforcing, recursive, grows over time',
    special:   'A-C-E nodes support each other. B-F-D nodes support each other.',
    color:     '#9b59b6',
    internalRules: [
      'A-C-E group support each other — same group amplifies',
      'B-F-D group support each other — same group amplifies',
      'Cross-group placement creates tension but not collapse',
      'Center F amplifies whichever group fills first',
      'All 6 filled = maximum recursion, near-legendary tier',
    ],
    slots: [
      { id: 'a',  label: 'A', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 145, 0), size: 44 },
      { id: 'b',  label: 'B', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 145, 72), size: 44 },
      { id: 'c',  label: 'C', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 145, 144), size: 44 },
      { id: 'd',  label: 'D', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 145, 216), size: 44 },
      { id: 'e',  label: 'E', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 145, 288), size: 44 },
      { id: 'f',  label: 'F', role: SLOT_ROLES.CORE,      group: NODE_GROUPS.BFD, x: CX, y: CY, size: 48 },
    ],
    svgPath: `<polygon points="${[0,72,144,216,288].map(a=>`${pt(CX,CY,160,a).x},${pt(CX,CY,160,a).y}`).join(' ')}"
               fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  // 5. Hexagon
  {
    id:        'hexagon',
    name:      'Hexagon',
    subtitle:  'Protective Matrix',
    tier:      SHAPE_TIERS.ADVANCED,
    unlocked:  false,
    unlockCondition: 'Unlock after casting 10 spells',
    affinity:  ['wind', 'earth'],
    affinityBonus: '+20% area effect when Wind occupies any A-C-E node',
    quality:   'Protective, perfectly distributed, area effect',
    special:   'A-C-E nodes support each other. B-F-D nodes support each other. Outer spikes radiate outward.',
    color:     '#5cb85c',
    internalRules: [
      'A-C-E alternating nodes support each other',
      'B-F-D alternating nodes support each other',
      'Outer spikes radiate the spell effect outward equally',
      'All 6 filled = full protective matrix activated',
      'Cross-group creates balanced tension, not collapse',
    ],
    slots: [
      { id: 'a',  label: 'A', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 145, 330), size: 44 },
      { id: 'b',  label: 'B', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 145, 30), size: 44 },
      { id: 'c',  label: 'C', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 145, 90), size: 44 },
      { id: 'd',  label: 'D', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 145, 150), size: 44 },
      { id: 'e',  label: 'E', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ACE, ...pt(CX, CY, 145, 210), size: 44 },
      { id: 'f',  label: 'F', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 145, 270), size: 44 },
    ],
    svgPath: `<polygon points="${[330,30,90,150,210,270].map(a=>`${pt(CX,CY,160,a).x},${pt(CX,CY,160,a).y}`).join(' ')}"
               fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  // 6. Star
  {
    id:        'star',
    name:      'Star',
    subtitle:  'The Reckoning',
    tier:      SHAPE_TIERS.MASTER,
    unlocked:  false,
    unlockCondition: 'Unlock after 2 hidden glyphs discovered',
    affinity:  ['shadow', 'fire'],
    affinityBonus: '+20% power when Shadow or Fire tips mirror each other',
    quality:   'Highest raw power, zero forgiveness, forces legendary tier',
    special:   'All 6 tips must be filled or catastrophic misfire. Unstable combos become STRONGER here.',
    color:     '#9b59b6',
    internalRules: [
      'Opposite tips mirror each other — 3 pairs',
      'Matching opposite pairs = power doubles',
      'Conflicting opposite pairs = controlled chaos, still powerful',
      'All 6 filled = legendary tier forced regardless of neatness',
      'Even ONE empty tip = catastrophic misfire',
      'Only shape where unstable combos produce stronger spells',
    ],
    slots: [
      { id: 'p0', label: '1', role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.ACE, ...pt(CX, CY, 155, 0), size: 42 },
      { id: 'p1', label: '2', role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.BFD, ...pt(CX, CY, 155, 60), size: 42 },
      { id: 'p2', label: '3', role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.ACE, ...pt(CX, CY, 155, 120), size: 42 },
      { id: 'p3', label: '4', role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.BFD, ...pt(CX, CY, 155, 180), size: 42 },
      { id: 'p4', label: '5', role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.ACE, ...pt(CX, CY, 155, 240), size: 42 },
      { id: 'p5', label: '6', role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.BFD, ...pt(CX, CY, 155, 300), size: 42 },
    ],
    svgPath: `<polygon points="${[0,120,240].map(a=>`${pt(CX,CY,160,a).x},${pt(CX,CY,160,a).y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="1"/>
              <polygon points="${[60,180,300].map(a=>`${pt(CX,CY,160,a).x},${pt(CX,CY,160,a).y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="1"/>`,
  },

  // 7. Tri-spell
  {
    id:        'trispell',
    name:      'Tri-spell',
    subtitle:  'Bridge of Three',
    tier:      SHAPE_TIERS.SPECIAL,
    unlocked:  false,
    unlockCondition: 'Unlock after 2 hidden glyphs, always middle shape',
    affinity:  ['fire','water','wind','earth','light','shadow','time'],
    affinityBonus: 'No affinity penalty — complements all elements equally',
    quality:   'Universal bridge, element fusion, connector',
    special:   'Must always be the MIDDLE shape in a 3-shape blueprint. Acts as bridge/connector.',
    color:     '#3b8bd4',
    internalRules: [
      '3 circle nodes can birth a new combined element when cast',
      'Overlap zones fuse the adjacent circle elements',
      'Must be position 2 in a 3-shape blueprint — always the bridge',
      'Complements all elements — no affinity penalty',
      'Fire + Water through Tri-spell = legitimate working, not unstable',
    ],
    slots: [
      { id: 'a',  label: 'A', role: SLOT_ROLES.BRIDGE,    group: NODE_GROUPS.ACE, ...pt(CX, CY, 100, 0), size: 44 },
      { id: 'b',  label: 'B', role: SLOT_ROLES.BRIDGE,    group: NODE_GROUPS.ACE, ...pt(CX, CY, 100, 120), size: 44 },
      { id: 'c',  label: 'C', role: SLOT_ROLES.BRIDGE,    group: NODE_GROUPS.ACE, ...pt(CX, CY, 100, 240), size: 44 },
      { id: 'd',  label: 'D', role: SLOT_ROLES.CHANNEL,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 55, 60), size: 36 },
      { id: 'e',  label: 'E', role: SLOT_ROLES.CHANNEL,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 55, 180), size: 36 },
      { id: 'f',  label: 'F', role: SLOT_ROLES.CHANNEL,   group: NODE_GROUPS.BFD, ...pt(CX, CY, 55, 300), size: 36 },
    ],
    svgPath: `<circle cx="${pt(CX,CY,80,0).x}" cy="${pt(CX,CY,80,0).y}" r="80" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
              <circle cx="${pt(CX,CY,80,120).x}" cy="${pt(CX,CY,80,120).y}" r="80" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>
              <circle cx="${pt(CX,CY,80,240).x}" cy="${pt(CX,CY,80,240).y}" r="80" fill="none" stroke="currentColor" stroke-width="1" opacity="0.7"/>`,
  },

  // 8. Spiral
  {
    id:        'spiral',
    name:      'Spiral',
    subtitle:  'The Deepening',
    tier:      SHAPE_TIERS.RARE,
    unlocked:  false,
    unlockCondition: 'Unlock after casting 1 legendary spell',
    affinity:  ['time', 'wind'],
    affinityBonus: '+20% momentum when Time is at slot 6 (innermost)',
    quality:   'Delayed activation, builds momentum, slot position changes power',
    special:   'Slot position changes glyph power level. Slot 6 defines the spell. Slot 1 is the weakest.',
    color:     '#4ecdc4',
    internalRules: [
      'Slot 1 = outermost, weakest power',
      'Slot 6 = innermost, strongest power',
      'Element at slot 6 defines the spell identity',
      'Slots 1-5 feed and shape the slot 6 element',
      'Time at slot 6 = near-infinite duration',
      'Wind at slot 1 = delayed trigger, fires later',
    ],
    slots: [
      { id: 's1', label: '1', role: SLOT_ROLES.CHANNEL,   group: NODE_GROUPS.ALL, ...pt(CX, CY, 150, 330), size: 38 },
      { id: 's2', label: '2', role: SLOT_ROLES.CHANNEL,   group: NODE_GROUPS.ALL, ...pt(CX, CY, 120, 60), size: 40 },
      { id: 's3', label: '3', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ALL, ...pt(CX, CY, 100, 150), size: 40 },
      { id: 's4', label: '4', role: SLOT_ROLES.SUPPORT,   group: NODE_GROUPS.ALL, ...pt(CX, CY, 75, 240), size: 42 },
      { id: 's5', label: '5', role: SLOT_ROLES.AMPLIFIER, group: NODE_GROUPS.ALL, ...pt(CX, CY, 50, 330), size: 44 },
      { id: 's6', label: '6', role: SLOT_ROLES.CORE,      group: NODE_GROUPS.ALL, x: CX, y: CY, size: 48 },
    ],
    svgPath: `<path d="M ${pt(CX,CY,150,330).x} ${pt(CX,CY,150,330).y}
               Q ${CX+80} ${CY-120} ${pt(CX,CY,120,60).x} ${pt(CX,CY,120,60).y}
               Q ${CX+130} ${CY+80} ${pt(CX,CY,100,150).x} ${pt(CX,CY,100,150).y}
               Q ${CX-80} ${CY+100} ${pt(CX,CY,75,240).x} ${pt(CX,CY,75,240).y}
               Q ${CX-60} ${CY-60} ${pt(CX,CY,50,330).x} ${pt(CX,CY,50,330).y}
               Q ${CX+30} ${CY-30} ${CX} ${CY}"
              fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  },

  // 9. Vesica
  {
    id:        'vesica',
    name:      'Vesica',
    subtitle:  'Bridge of Two',
    tier:      SHAPE_TIERS.RARE,
    unlocked:  false,
    unlockCondition: 'Unlock after casting Fire+Water unstable spell',
    affinity:  ['light', 'shadow'],
    affinityBonus: '+20% transformation when Light and Shadow are on opposite sides',
    quality:   'Duality, transformation, opposites merge into something new',
    special:   'The ONLY shape that makes Fire+Water a legitimate working instead of unstable collapse.',
    color:     '#a29bfe',
    internalRules: [
      'Left circle = sending element (3 slots)',
      'Right circle = receiving element (3 slots)',
      'Overlap zone = fusion point, auto-calculated',
      'Conflicting elements in different circles = rarest spells',
      'Fire left + Water right = Steam, mist, transformation',
      'Only shape that fully resolves elemental conflicts',
    ],
    slots: [
      { id: 'l0', label: 'L1', role: SLOT_ROLES.ANCHOR,   group: NODE_GROUPS.ACE, x: CX-100, y: CY-60, size: 40 },
      { id: 'l1', label: 'L2', role: SLOT_ROLES.ANCHOR,   group: NODE_GROUPS.ACE, x: CX-120, y: CY, size: 40 },
      { id: 'l2', label: 'L3', role: SLOT_ROLES.ANCHOR,   group: NODE_GROUPS.ACE, x: CX-100, y: CY+60, size: 40 },
      { id: 'r0', label: 'R1', role: SLOT_ROLES.BRIDGE,   group: NODE_GROUPS.BFD, x: CX+100, y: CY-60, size: 40 },
      { id: 'r1', label: 'R2', role: SLOT_ROLES.BRIDGE,   group: NODE_GROUPS.BFD, x: CX+120, y: CY, size: 40 },
      { id: 'r2', label: 'R3', role: SLOT_ROLES.BRIDGE,   group: NODE_GROUPS.BFD, x: CX+100, y: CY+60, size: 40 },
    ],
    svgPath: `<circle cx="${CX-60}" cy="${CY}" r="110" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.8"/>
              <circle cx="${CX+60}" cy="${CY}" r="110" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.8"/>`,
  },
]

// ── HELPER FUNCTIONS ─────────────────────────────

export function getShape(id) {
  return SHAPES.find(s => s.id === id) ?? null
}

export function getUnlockedShapes(stats = {}) {
  const spellsCount = stats.spellsCount ?? 0
  const hiddenCount = stats.hiddenGlyphsCount ?? 0
  const legendaryCount = stats.legendaryCount ?? 0
  const castFireWaterUnstable = stats.castFireWaterUnstable ?? false

  return SHAPES.map(shape => {
    let unlocked = shape.unlocked
    if (shape.id === 'pentagon' || shape.id === 'hexagon') {
      unlocked = spellsCount >= 10
    } else if (shape.id === 'star' || shape.id === 'trispell') {
      unlocked = hiddenCount >= 2
    } else if (shape.id === 'spiral') {
      unlocked = legendaryCount >= 1
    } else if (shape.id === 'vesica') {
      unlocked = castFireWaterUnstable
    }
    return { ...shape, unlocked }
  })
}

export function getSlot(shapeId, slotId) {
  const shape = getShape(shapeId)
  if (!shape) return null
  return shape.slots.find(s => s.id === slotId) ?? null
}

export function hasAffinity(shapeId, elementId) {
  const shape = getShape(shapeId)
  if (!shape) return false
  return shape.affinity.includes(elementId)
}

export function areSameGroup(slotA, slotB) {
  if (!slotA || !slotB) return false
  if (slotA.group === NODE_GROUPS.ALL || slotB.group === NODE_GROUPS.ALL) return true
  return slotA.group === slotB.group
}

export function getConnectorLabel(connectorType) {
  const conn = CONNECTOR_TYPES.find(c => c.id === connectorType)
  return conn ? conn.name : connectorType
}

export function validateBlueprintOrder(shapes) {
  if (!shapes || shapes.length === 0) return { valid: true }
  
  // shapes can be an array of shapeIds or shape objects
  const shapeIds = shapes.map(s => typeof s === 'string' ? s : s.shapeId)
  
  // Find index of trispell
  const triIndex = shapeIds.indexOf('trispell')
  if (triIndex !== -1) {
    if (shapeIds.length !== 3) {
      return { valid: false, error: 'Tri-spell requires exactly a 3-shape blueprint to bridge.' }
    }
    if (triIndex !== 1) {
      return { valid: false, error: 'Tri-spell must always be the middle shape in a 3-shape blueprint.' }
    }
  }
  return { valid: true }
}
