import './load-env.js'

export function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'your-secret-key'
}
