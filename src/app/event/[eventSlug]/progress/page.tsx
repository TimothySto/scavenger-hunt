import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export default async function ProgressPage({ params }: PageProps) {
  const { eventSlug } = await params
  redirect(`/event/${eventSlug}/home`)
}
