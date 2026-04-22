import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import './fetch-polyfill.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.resolve(currentDir, '..')
const rootDir = path.resolve(backendDir, '..')

;[
  path.join(backendDir, '.env.local'),
  path.join(backendDir, '.env'),
  path.join(rootDir, '.env.local'),
  path.join(rootDir, '.env')
].forEach((targetPath) => {
  if (fs.existsSync(targetPath)) {
    dotenv.config({ path: targetPath, override: false })
  }
})
