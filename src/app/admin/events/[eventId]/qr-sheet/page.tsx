import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import QRCode from 'qrcode'
import Link from 'next/link'
import PrintButton from './PrintButton'

type PageProps = {
  params: Promise<{ eventId: string }>
}

export default async function QrSheetPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { checkpoints: { where: { isActive: true }, orderBy: { name: 'asc' } } },
  })

  if (!event) notFound()

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'

  const checkpointsWithQr = await Promise.all(
    event.checkpoints.map(async (cp) => {
      const url = `${protocol}://${host}/checkin/${event.slug}/${cp.slug}`
      const qrDataUrl = await QRCode.toDataURL(url, { width: 250, margin: 2 })
      return { ...cp, qrDataUrl, checkinUrl: url }
    })
  )

  return (
    <>
      <style>{`
        @media print {
          .print-grid { display: grid !important; }
          body { margin: 0; }
        }
      `}</style>

      <main className="p-8">
        <div className="print:hidden mb-6 flex items-center justify-between">
          <div>
            <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 hover:underline">
              ← Back to event
            </Link>
            <h1 className="text-2xl font-bold mt-2">{event.name} — QR Sheet</h1>
            <p className="text-sm text-gray-500">{checkpointsWithQr.length} active checkpoints</p>
          </div>
          <PrintButton />
        </div>

        {checkpointsWithQr.length === 0 ? (
          <p className="text-gray-500">No active checkpoints for this event.</p>
        ) : (
          <div className="print-grid grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {checkpointsWithQr.map((cp) => (
              <div
                key={cp.id}
                className="flex flex-col items-center border rounded p-4 text-center break-inside-avoid"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cp.qrDataUrl} alt={`QR for ${cp.name}`} width={200} height={200} />
                <p className="mt-2 font-semibold text-sm">{cp.name}</p>
                <p className="text-xs text-gray-500">{cp.points} pts</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
