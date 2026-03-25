import type { Metadata } from 'next'
import { db } from '@/lib/db'

type Props = {
  params: Promise<{ eventSlug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { eventSlug } = await params
  const event = await db.event.findUnique({ where: { slug: eventSlug } })

  return {
    title: event?.name ?? 'Scavenger Hunt',
    icons: event?.logoUrl ? { icon: event.logoUrl } : undefined,
  }
}

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
