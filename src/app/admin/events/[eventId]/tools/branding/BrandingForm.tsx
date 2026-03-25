'use client'

import { useState, useRef } from 'react'
import {
  FONT_OPTIONS, SIZE_OPTIONS, TEXT_ELEMENT_KEYS, TEXT_ELEMENT_META,
  DEFAULT_TEXT_ELEMENTS, DEFAULT_STYLE, hexWithOpacity, contrastColor, sizeToCSS,
  type EventStyle, type TextElementStyle, type TextElementKey,
} from '@/lib/eventTheme'
import { updateEventBranding } from './actions'

// ─── Sub-components ───────────────────────────────────────────────────────────

type ColorRowProps = {
  label: string; hint: string
  name: string;  alphaName: string
  color: string; alpha: number
  onColor: (v: string) => void
  onAlpha: (v: number) => void
}
function ColorRow({ label, hint, name, alphaName, color, alpha, onColor, onAlpha }: ColorRowProps) {
  return (
    <div className="grid items-center gap-x-3" style={{ gridTemplateColumns: '6rem 2.25rem 6rem 1fr 3rem' }}>
      <div>
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      <input type="color" name={name} value={color} onChange={(e) => onColor(e.target.value)}
        className="h-9 w-9 rounded border cursor-pointer p-0.5 bg-white" />
      <input type="text" value={color} onChange={(e) => onColor(e.target.value)} maxLength={7}
        className="rounded-lg border px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-black" />
      <input type="range" name={alphaName} min={0} max={100} value={alpha}
        onChange={(e) => onAlpha(Number(e.target.value))} className="w-full accent-black" />
      <span className="text-xs text-gray-500 text-right tabular-nums">{alpha}%</span>
    </div>
  )
}

type TextRowProps = {
  elementKey: TextElementKey
  el: TextElementStyle
  onChange: (field: keyof TextElementStyle, value: string | boolean) => void
}
function TextRow({ elementKey, el, onChange }: TextRowProps) {
  const meta = TEXT_ELEMENT_META[elementKey]
  return (
    <div className="grid items-center gap-x-2" style={{ gridTemplateColumns: '7rem 4.5rem 2.25rem 5.5rem 1.75rem 1.75rem 2.25rem' }}>
      <div>
        <p className="text-sm font-medium leading-tight">{meta.label}</p>
        <p className="text-xs text-gray-400 leading-tight">{meta.hint}</p>
      </div>

      {/* Size */}
      <select value={el.size} onChange={(e) => onChange('size', e.target.value)}
        className="rounded-lg border px-1.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-black">
        {SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Swatch */}
      <input type="color" value={el.color} onChange={(e) => onChange('color', e.target.value)}
        className="h-9 w-9 rounded border cursor-pointer p-0.5 bg-white" />

      {/* Hex */}
      <input type="text" value={el.color} onChange={(e) => onChange('color', e.target.value)}
        maxLength={7} className="rounded-lg border px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-black" />

      {/* Bold */}
      <button type="button" onClick={() => onChange('bold', !el.bold)} title="Bold"
        className={`h-8 w-7 rounded border text-xs font-bold transition-colors ${el.bold ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
        B
      </button>

      {/* Italic */}
      <button type="button" onClick={() => onChange('italic', !el.italic)} title="Italic"
        className={`h-8 w-7 rounded border text-xs italic transition-colors ${el.italic ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
        I
      </button>

      {/* Uppercase */}
      <button type="button" onClick={() => onChange('uppercase', !el.uppercase)} title="Uppercase"
        className={`h-8 rounded border text-[10px] font-bold px-1 transition-colors ${el.uppercase ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
        AA
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elToStyle(el: TextElementStyle): React.CSSProperties {
  return {
    fontSize: sizeToCSS(el.size),
    color: el.color,
    fontWeight: el.bold ? 700 : 400,
    fontStyle: el.italic ? 'italic' : 'normal',
    textTransform: el.uppercase ? 'uppercase' : 'none',
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  eventId: string
  initial: { name: string; description: string; logoUrl: string; style: EventStyle }
}

export default function BrandingForm({ eventId, initial }: Props) {
  const [name,        setName]        = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [logoUrl,     setLogoUrl]     = useState(initial.logoUrl)

  const [fontFamily,  setFontFamily]  = useState(initial.style.fontFamily)
  const [fontBold,    setFontBold]    = useState(initial.style.fontBold)
  const [fontItalic,  setFontItalic]  = useState(initial.style.fontItalic)

  const [primaryColor,    setPrimaryColor]    = useState(initial.style.primaryColor)
  const [primaryAlpha,    setPrimaryAlpha]    = useState(initial.style.primaryAlpha)
  const [accentColor,     setAccentColor]     = useState(initial.style.accentColor)
  const [accentAlpha,     setAccentAlpha]     = useState(initial.style.accentAlpha)
  const [backgroundColor, setBackgroundColor] = useState(initial.style.backgroundColor)
  const [backgroundAlpha, setBackgroundAlpha] = useState(initial.style.backgroundAlpha)

  const [textElements, setTextElements] = useState<Record<TextElementKey, TextElementStyle>>(
    initial.style.textElements ?? DEFAULT_TEXT_ELEMENTS
  )

  const [adminFontFamily,  setAdminFontFamily]  = useState(initial.style.adminFontFamily  ?? DEFAULT_STYLE.adminFontFamily)
  const [adminAccentColor, setAdminAccentColor] = useState(initial.style.adminAccentColor ?? DEFAULT_STYLE.adminAccentColor)

  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const action  = updateEventBranding.bind(null, eventId)

  function updateElement(key: TextElementKey, field: keyof TextElementStyle, value: string | boolean) {
    setTextElements((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setLogoUrl(url)
    } catch {
      setUploadError('Upload failed — try again.')
    } finally {
      setUploading(false)
    }
  }

  // Preview computed values
  const previewBg          = hexWithOpacity(backgroundColor, backgroundAlpha)
  const previewPrimary     = hexWithOpacity(primaryColor,    primaryAlpha)
  const previewAccent      = hexWithOpacity(accentColor,     accentAlpha)
  const previewAccentFaint = hexWithOpacity(accentColor,     Math.round(accentAlpha * 0.13))
  const previewFont        = `'${fontFamily}', sans-serif`
  const previewBtnText     = contrastColor(primaryColor)

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
      style={{ fontFamily: `'${fontFamily}', ui-sans-serif, system-ui, sans-serif` }}
    >

      {/* ── Form ─────────────────────────────────────────── */}
      <form action={action} className="space-y-6">
        {/* Hidden fields */}
        <input type="hidden" name="fontBold"          value={fontBold   ? 'true' : 'false'} />
        <input type="hidden" name="fontItalic"        value={fontItalic ? 'true' : 'false'} />
        <input type="hidden" name="textElementsJson"  value={JSON.stringify(textElements)} />
        <input type="hidden" name="adminFontFamily"   value={adminFontFamily} />
        <input type="hidden" name="adminAccentColor"  value={adminAccentColor} />

        {/* ── Event Identity ── */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-xs uppercase tracking-wide text-gray-400">Event Identity</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Event Name</label>
            <input name="name" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Logo</label>
            <div className="flex items-center gap-3">
              <input name="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/uploads/logo.png or https://…"
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="shrink-0 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo preview" className="mt-3 h-12 object-contain rounded border bg-gray-50 p-1" />
            )}
          </div>
        </section>

        {/* ── Colours & Font ── */}
        <section className="rounded-xl border bg-white p-5 space-y-5">
          <h2 className="font-semibold text-xs uppercase tracking-wide text-gray-400">Colours &amp; Font</h2>

          {/* Font row */}
          <div>
            <label className="block text-sm font-medium mb-1">Font Family</label>
            <div className="flex items-center gap-2">
              <select name="fontFamily" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black">
                {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <button type="button" onClick={() => setFontBold(!fontBold)} title="Bold"
                className={`h-10 w-10 rounded-lg border text-sm font-bold transition-colors ${fontBold ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>B</button>
              <button type="button" onClick={() => setFontItalic(!fontItalic)} title="Italic"
                className={`h-10 w-10 rounded-lg border text-sm italic transition-colors ${fontItalic ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>I</button>
            </div>
          </div>

          {/* Colour header */}
          <div className="grid text-xs font-semibold uppercase tracking-wide text-gray-400 gap-x-3"
            style={{ gridTemplateColumns: '6rem 2.25rem 6rem 1fr 3rem' }}>
            <span>Colour</span><span /><span>Hex</span><span>Opacity</span><span className="text-right">%</span>
          </div>

          <div className="space-y-4">
            <ColorRow label="Primary" hint="Buttons"
              name="primaryColor" alphaName="primaryAlpha"
              color={primaryColor} alpha={primaryAlpha}
              onColor={setPrimaryColor} onAlpha={setPrimaryAlpha} />
            <ColorRow label="Accent" hint="Highlights"
              name="accentColor" alphaName="accentAlpha"
              color={accentColor} alpha={accentAlpha}
              onColor={setAccentColor} onAlpha={setAccentAlpha} />
            <ColorRow label="Background" hint="Page bg"
              name="backgroundColor" alphaName="backgroundAlpha"
              color={backgroundColor} alpha={backgroundAlpha}
              onColor={setBackgroundColor} onAlpha={setBackgroundAlpha} />
          </div>
        </section>

        {/* ── Text Elements ── */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-xs uppercase tracking-wide text-gray-400">Text Elements</h2>

          {/* Column headers */}
          <div className="grid text-xs font-semibold uppercase tracking-wide text-gray-400 gap-x-2"
            style={{ gridTemplateColumns: '7rem 4.5rem 2.25rem 5.5rem 1.75rem 1.75rem 2.25rem' }}>
            <span>Element</span>
            <span>Size</span>
            <span />
            <span>Colour</span>
            <span className="text-center">B</span>
            <span className="text-center">I</span>
            <span className="text-center">AA</span>
          </div>

          <div className="space-y-4">
            {TEXT_ELEMENT_KEYS.map((key) => (
              <TextRow
                key={key}
                elementKey={key}
                el={textElements[key]}
                onChange={(field, value) => updateElement(key, field, value)}
              />
            ))}
          </div>
        </section>

        {/* ── Admin Pages ── */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-xs uppercase tracking-wide text-gray-400">Admin Pages</h2>
            <p className="text-xs text-gray-400 mt-1">
              Controls how the event&apos;s admin pages (dashboards, tools) look — separate from the player theme.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Admin Font Family</label>
            <select
              value={adminFontFamily}
              onChange={(e) => setAdminFontFamily(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            >
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Admin Accent Colour</label>
            <p className="text-xs text-gray-400 mb-2">Used for links and action buttons in admin pages.</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={adminAccentColor}
                onChange={(e) => setAdminAccentColor(e.target.value)}
                className="h-9 w-9 rounded border cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={adminAccentColor}
                onChange={(e) => setAdminAccentColor(e.target.value)}
                maxLength={7}
                className="rounded-lg border px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-black w-28"
              />
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: adminAccentColor }}
              >
                Preview link
              </span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: previewPrimary, color: previewBtnText }}
        >
          Save Changes
        </button>
      </form>

      {/* ── Live Preview ──────────────────────────────────── */}
      <div className="sticky top-8 self-start space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Live Preview</p>

        {/* Page preview */}
        <div className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: previewBg, fontFamily: previewFont,
            fontWeight: fontBold ? 700 : 400, fontStyle: fontItalic ? 'italic' : 'normal' }}>
          <div className="p-5 space-y-3">
            <div className="rounded-xl bg-white border p-5">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-8 object-contain mb-3" />
              )}
              <p style={elToStyle(textElements.heading)}>{name || 'Event Name'}</p>
              {description && <p className="mt-1 line-clamp-2" style={elToStyle(textElements.subtitle)}>{description}</p>}
            </div>

            <div className="rounded-xl border-2 border-dashed p-4"
              style={{ backgroundColor: previewAccentFaint, borderColor: previewAccent }}>
              <p className="mb-1" style={{ ...elToStyle(textElements.label), color: previewAccent }}>Recovery Code</p>
              <p className="font-mono tracking-widest" style={{ ...elToStyle(textElements.code), color: previewAccent }}>AB12CD34</p>
            </div>

            <div className="rounded-xl bg-white border p-4 flex justify-between items-center">
              <div>
                <p style={elToStyle(textElements.label)}>Checkpoints</p>
                <p style={elToStyle(textElements.score)}>3</p>
              </div>
              <div className="text-right">
                <p style={elToStyle(textElements.label)}>Score</p>
                <p style={elToStyle(textElements.score)}>45</p>
              </div>
            </div>

            <button className="w-full rounded-lg py-3 text-sm font-semibold"
              style={{ backgroundColor: previewPrimary, color: previewBtnText }}>
              Join the Hunt →
            </button>
          </div>
        </div>

        {/* Typography specimen */}
        <div className="rounded-2xl border bg-white p-5 space-y-3" style={{ fontFamily: previewFont }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Typography</p>
          {TEXT_ELEMENT_KEYS.map((key) => (
            <div key={key} className="flex items-baseline justify-between gap-4 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <span className="text-xs text-gray-400 shrink-0 w-20">{TEXT_ELEMENT_META[key].label}</span>
              <span className="truncate text-right" style={elToStyle(textElements[key])}>
                {TEXT_ELEMENT_META[key].example}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
