import { type EventStyle, getFontUrl, hexWithOpacity, contrastColor, sizeToCSS, type TextElementStyle } from '@/lib/eventTheme'

type Props = { style: EventStyle }

function elementCSS(cls: string, el: TextElementStyle): string {
  return `.${cls} {
    font-size: ${sizeToCSS(el.size)};
    color: ${el.color};
    font-weight: ${el.bold ? 700 : 400};
    font-style: ${el.italic ? 'italic' : 'normal'};
    text-transform: ${el.uppercase ? 'uppercase' : 'none'};
  }`
}

export default function EventThemeStyle({ style }: Props) {
  const fontUrl     = getFontUrl(style.fontFamily)
  const primary     = hexWithOpacity(style.primaryColor,    style.primaryAlpha)
  const btnText     = contrastColor(style.primaryColor)
  const accent      = hexWithOpacity(style.accentColor,     style.accentAlpha)
  const accentFaint = hexWithOpacity(style.accentColor,     Math.round(style.accentAlpha * 0.13))
  const bg          = hexWithOpacity(style.backgroundColor, style.backgroundAlpha)
  const te          = style.textElements

  return (
    <>
      {fontUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontUrl} />
      )}
      <style>{`
        .event-themed {
          font-family: '${style.fontFamily}', ui-sans-serif, system-ui, sans-serif;
          font-weight: ${style.fontBold ? 700 : 400};
          font-style: ${style.fontItalic ? 'italic' : 'normal'};
          background-color: ${bg};
          min-height: 100vh;
        }
        .event-btn-primary {
          background-color: ${primary};
          color: ${btnText};
        }
        .event-btn-primary:hover { opacity: 0.88; }
        .event-accent-box {
          background-color: ${accentFaint};
          border-color: ${accent};
        }
        .event-accent-text { color: ${accent}; }

        ${elementCSS('event-heading',  te.heading)}
        ${elementCSS('event-subtitle', te.subtitle)}
        ${elementCSS('event-label',    te.label)}
        ${elementCSS('event-body',     te.body)}
        ${elementCSS('event-code',     te.code)}
        ${elementCSS('event-score',    te.score)}
      `}</style>
    </>
  )
}
