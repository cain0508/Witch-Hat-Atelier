// ═══════════════════════════════════════════════
//  MONGODB — Database connection
//  Reuses the same connection across requests
//  so we don't open a new connection every time.
// ═══════════════════════════════════════════════

import { MongoClient } from 'mongodb'

const uri    = process.env.MONGODB_URI
const options = {}

let client
let clientPromise

if (!uri) {
  throw new Error('MONGODB_URI is missing from .env.local')
}

if (process.env.NODE_ENV === 'development') {
  // In development reuse the connection across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production create a fresh connection
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

// ── HELPER ───────────────────────────────────────
// Call this in any API route to get the database
// Usage: const db = await getDb()

export async function getDb() {
  const client = await clientPromise
  return client.db('wha-sigil-forge')
}
