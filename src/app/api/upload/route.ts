import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { validateAndRefreshSession } from '@/lib/adminSession'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export async function POST(req: Request) {
  // Require a valid admin session
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE_NAME)?.value
  if (!token || !(await validateAndRefreshSession(token))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })
  }

  const eventId = formData.get('eventId')?.toString() ?? ''

  // Prevent path traversal — cuid/alphanumeric only
  if (eventId && !/^[a-zA-Z0-9_-]+$/.test(eventId)) {
    return NextResponse.json({ error: 'Invalid eventId' }, { status: 400 })
  }

  const ext = EXT_MAP[file.type]
  const filename = `${randomUUID()}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', ...(eventId ? [eventId] : []))
  await mkdir(uploadDir, { recursive: true })
  const filepath = join(uploadDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  const url = eventId ? `/uploads/${eventId}/${filename}` : `/uploads/${filename}`
  return NextResponse.json({ url })
}
