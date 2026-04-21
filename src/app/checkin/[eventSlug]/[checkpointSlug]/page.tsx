import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'
import { computeScore } from '@/lib/score'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import CheckinClient from './CheckinClient'
import ExhibitClient from './ExhibitClient'
import PrizeRedemptionClient from './PrizeRedemptionClient'

type PageProps = {
  params: Promise<{
    eventSlug: string
    checkpointSlug: string
  }>
  searchParams: Promise<{ preview?: string }>
}

type CheckpointContent = {
  sponsorLogo?: string
  backgroundImage?: string
  blurb?: string
  prizeInstructions?: string
  question?: string
  correctAnswer?: string
  answerChoices?: string[]
  acceptedAnswers?: string[]
  enableQuestion?: boolean
}

function parseContent(raw: unknown): CheckpointContent {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const obj = raw as Record<string, unknown>
  return {
    sponsorLogo:      typeof obj.sponsorLogo      === 'string'  ? obj.sponsorLogo      : undefined,
    backgroundImage:  typeof obj.backgroundImage  === 'string'  ? obj.backgroundImage  : undefined,
    blurb:            typeof obj.blurb            === 'string'  ? obj.blurb            : undefined,
    prizeInstructions:typeof obj.prizeInstructions=== 'string'  ? obj.prizeInstructions: undefined,
    question:         typeof obj.question         === 'string'  ? obj.question         : undefined,
    correctAnswer:    typeof obj.correctAnswer    === 'string'  ? obj.correctAnswer    : undefined,
    enableQuestion:   typeof obj.enableQuestion   === 'boolean' ? obj.enableQuestion   : undefined,
    answerChoices:    Array.isArray(obj.answerChoices)
      ? (obj.answerChoices as unknown[]).filter((c): c is string => typeof c === 'string')
      : undefined,
    acceptedAnswers:  Array.isArray(obj.acceptedAnswers)
      ? (obj.acceptedAnswers as unknown[]).filter((c): c is string => typeof c === 'string')
      : undefined,
  }
}

export default async function CheckinPage({ params, searchParams }: PageProps) {
  const { eventSlug, checkpointSlug } = await params
  const { preview } = await searchParams
  const isPreview = preview === '1'

  const event = await db.event.findUnique({
    where: { slug: eventSlug, isActive: true },
    select: {
      id: true, name: true, slug: true, logoUrl: true,
      isActive: true, conversionBonusPoints: true,
    },
  })

  if (!event) notFound()

  const checkpoint = await db.checkpoint.findFirst({
    where: { eventId: event.id, slug: checkpointSlug, isActive: true },
  })

  if (!checkpoint) notFound()

  // Require an active session — redirect newcomers to the join page
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const hasSession = cookieId
    ? !!(await db.participantSession.findUnique({
        where: { eventId_cookieId: { eventId: event.id, cookieId } },
      }))
    : false

  if (!hasSession && !isPreview) {
    redirect(`/event/${eventSlug}?next=/checkin/${eventSlug}/${checkpointSlug}`)
  }

  const content = parseContent(checkpoint.contentJson)

  // Prize redemption: show score summary + confirm completion
  if (checkpoint.type === 'PRIZE_REDEMPTION') {
    let currentScore = 0
    let checkpointsCompleted = 0
    let isAlreadyCompleted = false

    // cookieId is guaranteed non-null here (hasSession check above)
    const session = await db.participantSession.findUnique({
      where: { eventId_cookieId: { eventId: event.id, cookieId: cookieId! } },
      include: {
        checkIns: { include: { checkpoint: true } },
        adjustments: true,
      },
    })

    if (session) {
      isAlreadyCompleted = session.completedAt !== null
      const scoringCheckIns = session.checkIns.filter(
        (ci) => ci.checkpoint.type !== 'PRIZE_REDEMPTION'
      )
      currentScore = computeScore(session.checkIns, session.adjustments)
      checkpointsCompleted = scoringCheckIns.length
    }

    const scoringCheckpoints = await db.checkpoint.count({
      where: { eventId: event.id, isActive: true },
    })

    return (
      <PrizeRedemptionClient
        eventId={event.id}
        eventSlug={eventSlug}
        eventName={event.name}
        eventLogoUrl={event.logoUrl}
        checkpointId={checkpoint.id}
        checkpointPoints={checkpoint.points}
        currentScore={currentScore}
        checkpointsCompleted={checkpointsCompleted}
        totalScoringCheckpoints={scoringCheckpoints - 1} // exclude this checkpoint
        isAlreadyCompleted={isAlreadyCompleted}
        prizeInstructions={content.prizeInstructions ?? null}
      />
    )
  }

  // EXHIBIT_QUESTION always uses the question mechanic.
  // Plain EXHIBIT falls through when question + correctAnswer are set.
  // ONSITE_SPONSOR uses it when enableQuestion is toggled on and question + correctAnswer are set.
  const isQuestionCheckpoint =
    checkpoint.type === 'EXHIBIT_QUESTION' ||
    (checkpoint.type === 'EXHIBIT' && !!content.question && !!content.correctAnswer) ||
    (checkpoint.type === 'ONSITE_SPONSOR' && !!content.enableQuestion && !!content.question && !!content.correctAnswer)

  if (isQuestionCheckpoint && content.question && content.correctAnswer) {
    return (
      <ExhibitClient
        eventId={event.id}
        eventName={event.name}
        eventLogoUrl={event.logoUrl}
        eventSlug={eventSlug}
        checkpointId={checkpoint.id}
        checkpointName={checkpoint.name}
        question={content.question}
        correctAnswer={content.correctAnswer}
        answerChoices={content.answerChoices ?? []}
        acceptedAnswers={content.acceptedAnswers ?? []}
        blurb={content.blurb ?? null}
        backgroundImage={content.backgroundImage ?? null}
        sponsorLogo={content.sponsorLogo ?? null}
        fallbackUrl={checkpoint.fallbackUrl ?? null}
        conversionBonusPoints={event.conversionBonusPoints}
        isPreview={isPreview}
      />
    )
  }

  return (
    <CheckinClient
      eventId={event.id}
      eventName={event.name}
      eventLogoUrl={event.logoUrl}
      eventSlug={eventSlug}
      checkpointId={checkpoint.id}
      checkpointName={checkpoint.name}
      fallbackUrl={checkpoint.fallbackUrl}
      content={content}
      conversionBonusPoints={event.conversionBonusPoints}
      isPreview={isPreview}
    />
  )
}
