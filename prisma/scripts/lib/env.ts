/**
 * Shared utility for reading and writing .env values in-place.
 * Preserves all comments, blank lines, and surrounding content.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ENV_PATH = resolve(process.cwd(), '.env')

export function readEnvFile(): string {
  return existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf-8') : ''
}

export function getEnvValue(key: string): string | undefined {
  const match = readEnvFile().match(new RegExp(`^${key}=(.*)$`, 'm'))
  if (!match) return undefined
  return match[1].replace(/^["']|["']$/g, '').trim()
}

/**
 * Updates an existing KEY=value line (including commented-out # KEY=... lines),
 * or appends KEY=value at the end if not found.
 */
export function setEnvValue(key: string, value: string): void {
  let content = readEnvFile()
  const newLine = `${key}=${value}`
  // Match both active and commented-out versions of the key
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, 'm')

  if (pattern.test(content)) {
    content = content.replace(pattern, newLine)
  } else {
    content = content.trimEnd() + '\n' + newLine + '\n'
  }

  writeFileSync(ENV_PATH, content, 'utf-8')
}
