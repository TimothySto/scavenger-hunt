import { db } from '@/lib/db'
import { parseEventStyle, getFontUrl } from '@/lib/eventTheme'

type Props = {
  params: Promise<{ eventId: string }>
  children: React.ReactNode
}

export default async function AdminEventLayout({ params, children }: Props) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  const theme = parseEventStyle(event?.styleJson ?? null)

  const fontUrl = getFontUrl(theme.adminFontFamily)

  return (
    <>
      {fontUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontUrl} />
      )}
      <style>{`
        .admin-event-themed {
          font-family: '${theme.adminFontFamily}', ui-sans-serif, system-ui, sans-serif;
        }
        .admin-event-themed a.admin-link,
        .admin-event-themed .admin-accent {
          color: ${theme.adminAccentColor};
        }
        .admin-event-themed .admin-btn {
          background-color: ${theme.adminAccentColor};
          color: #ffffff;
        }
      `}</style>
      <div className="admin-event-themed min-h-screen">
        {children}
      </div>
    </>
  )
}
