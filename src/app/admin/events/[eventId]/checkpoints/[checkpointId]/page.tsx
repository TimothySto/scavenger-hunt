import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { readdirSync } from 'fs'
import { join } from 'path'
import QRCode from 'qrcode'
import Link from 'next/link'
import CheckpointEditForm from './CheckpointEditForm'
import PreviewFrame from '@/components/admin/PreviewFrame'

type PageProps = {
  params: Promise<{
    eventId: string
    checkpointId: string
  }>
}

function getEventImages(eventId: string) {
  const uploadDir = join(process.cwd(), 'public', 'uploads', eventId)
  try {
    return readdirSync(uploadDir)
      .filter((f) => !f.startsWith('.'))
      .map((filename) => ({ filename, url: `/uploads/${eventId}/${filename}` }))
      .reverse()
  } catch {
    return []
  }
}

function parseContent(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const obj = raw as Record<string, unknown>
  return {
    sponsorLogo:       typeof obj.sponsorLogo       === 'string'  ? obj.sponsorLogo       : undefined,
    backgroundImage:   typeof obj.backgroundImage   === 'string'  ? obj.backgroundImage   : undefined,
    blurb:             typeof obj.blurb             === 'string'  ? obj.blurb             : undefined,
    prizeInstructions: typeof obj.prizeInstructions === 'string'  ? obj.prizeInstructions : undefined,
    question:          typeof obj.question          === 'string'  ? obj.question          : undefined,
    correctAnswer:     typeof obj.correctAnswer     === 'string'  ? obj.correctAnswer     : undefined,
    answerChoices:     Array.isArray(obj.answerChoices)
      ? (obj.answerChoices as unknown[]).filter((c): c is string => typeof c === 'string')
      : undefined,
    questionMode:      obj.questionMode === true                  ? true                  : undefined,
    showTag:           obj.showTag      === false                 ? false                 : undefined,
    isObscured:        obj.isObscured   === true                  ? true                  : undefined,
    originalSlug:      typeof obj.originalSlug      === 'string'  ? obj.originalSlug      : undefined,
  }
}

export default async function CheckpointDetailPage({ params }: PageProps) {
  const { eventId, checkpointId } = await params

  const checkpoint = await db.checkpoint.findUnique({
    where: { id: checkpointId },
    include: { event: true },
  })

  if (!checkpoint || checkpoint.eventId !== eventId) notFound()

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const checkinUrl = `${protocol}://${host}/checkin/${checkpoint.event.slug}/${checkpoint.slug}`

  const qrDataUrl = await QRCode.toDataURL(checkinUrl, { width: 256, margin: 2 })
  const images = getEventImages(eventId)
  const content = parseContent(checkpoint.contentJson)

  return (
    <main className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {checkpoint.event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{checkpoint.name}</h1>
        <p className="text-sm text-gray-400 font-mono mt-0.5">/checkin/{checkpoint.event.slug}/{checkpoint.slug}</p>
      </div>

      <CheckpointEditForm
        checkpointId={checkpointId}
        eventId={eventId}
        name={checkpoint.name}
        type={checkpoint.type}
        points={checkpoint.points}
        clue={checkpoint.clue}
        fallbackUrl={checkpoint.fallbackUrl}
        isActive={checkpoint.isActive}
        content={content}
        images={images}
        currentSlug={checkpoint.slug}
        eventSlug={checkpoint.event.slug}
      />

      <PreviewFrame
        url={`/checkin/${checkpoint.event.slug}/${checkpoint.slug}?preview=1`}
        label="Checkpoint Page Preview"
      />

      {/* QR Code */}
      <div className="mt-8 rounded-lg border bg-white p-5">
        <h2 className="font-semibold mb-3">QR Code</h2>
        <p className="text-sm text-gray-500 font-mono mb-4 break-all">{checkinUrl}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR code for ${checkpoint.name}`} width={256} height={256} className="mb-4" />
        <a
          href={qrDataUrl}
          download={`qr-${checkpoint.slug}.png`}
          className="inline-block rounded bg-black px-4 py-2 text-white text-sm"
        >
          Download QR Code
        </a>
      </div>
    </main>
  )
}
