// ═══════════════════════════════════════════════
//  UNLOCK SYSTEM — Discovery logic + persistence
//  Checks placed glyphs against recipes after
//  every cast. Saves unlocked state to localStorage
//  so discoveries persist across sessions.
// ═══════════════════════════════════════════════

import { GLYPHS, UNLOCK_RECIPES, getGlyph } from './glyphs'

const STORAGE_KEY = 'wha_unlocked_glyphs'

// ── PERSISTENCE ──────────────────────────────────
// Save + load unlocked glyph ids from localStorage

export function loadUnlockedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultUnlockedIds()
    return JSON.parse(raw)
  } catch {
    return getDefaultUnlockedIds()
  }
}

export function saveUnlockedIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage unavailable — silent fail
  }
}

// Default = all glyphs where unlocked: true in data
function getDefaultUnlockedIds() {
  return GLYPHS.filter(g => g.unlocked).map(g => g.id)
}

// ── UNLOCK CHECK ─────────────────────────────────
// Call this after every successful cast.
// Returns the newly unlocked glyph or null.

export function checkForUnlock(placedGlyphs, alreadyUnlockedIds) {
  const placedIds = Object.values(placedGlyphs)

  for (const recipe of UNLOCK_RECIPES) {
    // Skip if already unlocked
    if (alreadyUnlockedIds.includes(recipe.unlocksId)) continue

    // Check if all required glyphs are placed
    const allPresent = recipe.requires.every(req => placedIds.includes(req))

    if (allPresent) {
      const newGlyph = getGlyph(recipe.unlocksId)
      return {
        glyph:   newGlyph,
        recipe,
      }
    }
  }

  return null  // no new unlock
}

// ── RANK SYSTEM ──────────────────────────────────
// Atelier rank based on how many glyphs discovered

const RANKS = [
  { min: 0,  max: 8,  title: 'Apprentice',      color: '#a09ab8' },
  { min: 9,  max: 10, title: 'Journeyman',       color: '#5cb85c' },
  { min: 11, max: 12, title: 'Artisan Witch',    color: '#4ecdc4' },
  { min: 13, max: 14, title: 'Master Witch',     color: '#c9a84c' },
  { min: 15, max: 99, title: 'Grimoire Keeper',  color: '#fd79a8' },
]

export function getRank(unlockedCount) {
  return RANKS.find(r => unlockedCount >= r.min && unlockedCount <= r.max)
    ?? RANKS[0]
}

// ── HINT SYSTEM ──────────────────────────────────
// Returns a cryptic hint for the next undiscovered
// glyph — shown subtly in the UI to encourage exploration

export function getNextHint(alreadyUnlockedIds) {
  const nextRecipe = UNLOCK_RECIPES.find(
    r => !alreadyUnlockedIds.includes(r.unlocksId)
  )
  return nextRecipe?.hint ?? null
}
