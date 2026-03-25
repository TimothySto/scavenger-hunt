// ─── Text element types ───────────────────────────────────────────────────────

export type TextElementStyle = {
  size: string     // one of SIZE_OPTIONS values
  color: string    // hex
  bold: boolean
  italic: boolean
  uppercase: boolean
}

export const TEXT_ELEMENT_KEYS = ['heading', 'subtitle', 'label', 'body', 'code', 'score'] as const
export type TextElementKey = (typeof TEXT_ELEMENT_KEYS)[number]

export type TextElements = Record<TextElementKey, TextElementStyle>

export const TEXT_ELEMENT_META: Record<TextElementKey, { label: string; hint: string; example: string }> = {
  heading:  { label: 'Event Title',  hint: 'Main page heading',          example: 'Spring Hunt 2026' },
  subtitle: { label: 'Subtitle',     hint: 'Description / "Playing as"', example: 'Playing as Team Rocket' },
  label:    { label: 'Labels',       hint: 'Small caps labels',          example: 'Recovery Code' },
  body:     { label: 'Body Text',    hint: 'Checkpoint names & clues',   example: 'Visit a checkpoint to earn points.' },
  code:     { label: 'Code Display', hint: 'Recovery / verification code', example: 'AB12CD34' },
  score:    { label: 'Score Number', hint: 'Large score / points display', example: '45' },
}

export const DEFAULT_TEXT_ELEMENTS: TextElements = {
  heading:  { size: '3xl', color: '#111827', bold: true,  italic: false, uppercase: false },
  subtitle: { size: 'sm',  color: '#6b7280', bold: false, italic: false, uppercase: false },
  label:    { size: 'xs',  color: '#9ca3af', bold: true,  italic: false, uppercase: true  },
  body:     { size: 'sm',  color: '#374151', bold: false, italic: false, uppercase: false },
  code:     { size: '3xl', color: '#111827', bold: true,  italic: false, uppercase: false },
  score:    { size: '6xl', color: '#111827', bold: true,  italic: false, uppercase: false },
}

// ─── Size scale ───────────────────────────────────────────────────────────────

export const SIZE_OPTIONS = [
  { label: 'XS',   value: 'xs',   css: '0.75rem'  },
  { label: 'SM',   value: 'sm',   css: '0.875rem' },
  { label: 'Base', value: 'base', css: '1rem'     },
  { label: 'LG',   value: 'lg',   css: '1.125rem' },
  { label: 'XL',   value: 'xl',   css: '1.25rem'  },
  { label: '2XL',  value: '2xl',  css: '1.5rem'   },
  { label: '3XL',  value: '3xl',  css: '1.875rem' },
  { label: '4XL',  value: '4xl',  css: '2.25rem'  },
  { label: '5XL',  value: '5xl',  css: '3rem'     },
  { label: '6XL',  value: '6xl',  css: '3.75rem'  },
] as const

export function sizeToCSS(size: string): string {
  return SIZE_OPTIONS.find((o) => o.value === size)?.css ?? '1rem'
}

// ─── Global style type ────────────────────────────────────────────────────────

export type EventStyle = {
  fontFamily: string
  fontBold: boolean
  fontItalic: boolean
  primaryColor: string
  primaryAlpha: number
  accentColor: string
  accentAlpha: number
  backgroundColor: string
  backgroundAlpha: number
  textElements: TextElements
  adminFontFamily: string   // font for admin event pages; defaults to fontFamily
  adminAccentColor: string  // accent/link colour for admin pages
  // Landing page content
  landingBackgroundImage: string
  landingCtaText: string
  // Homepage content
  homeAnnouncement: string
  homeBackgroundImage: string
  showRecoveryCode: boolean
  recoveryCodeTitle: string
  recoveryCodeSubtext: string
  // Welcome / pass-through page
  showWelcomePage: boolean
  welcomeBackgroundImage: string
  welcomeRulesText: string
  welcomeCtaText: string
}

export const DEFAULT_STYLE: EventStyle = {
  fontFamily: 'Inter',
  fontBold: false,
  fontItalic: false,
  primaryColor: '#111827',
  primaryAlpha: 100,
  accentColor: '#f59e0b',
  accentAlpha: 100,
  backgroundColor: '#f9fafb',
  backgroundAlpha: 100,
  textElements: DEFAULT_TEXT_ELEMENTS,
  adminFontFamily: 'Inter',
  adminAccentColor: '#111827',
  landingBackgroundImage: '',
  landingCtaText: '',
  homeAnnouncement: '',
  homeBackgroundImage: '',
  showRecoveryCode: true,
  recoveryCodeTitle: 'Your Recovery Code — screenshot this!',
  recoveryCodeSubtext: 'If you lose your progress, show this code to an organizer to restore your session.',
  showWelcomePage: false,
  welcomeBackgroundImage: '',
  welcomeRulesText: '',
  welcomeCtaText: 'Start the Hunt →',
}

// ─── Font options ─────────────────────────────────────────────────────────────

export const FONT_OPTIONS = [
  { label: 'Inter',            value: 'Inter',            googleFamily: 'Inter:wght@400;500;600;700;900' },
  { label: 'Poppins',          value: 'Poppins',          googleFamily: 'Poppins:wght@400;500;600;700;900' },
  { label: 'Roboto',           value: 'Roboto',           googleFamily: 'Roboto:wght@400;500;700;900' },
  { label: 'Montserrat',       value: 'Montserrat',       googleFamily: 'Montserrat:wght@400;500;600;700;900' },
  { label: 'Playfair Display', value: 'Playfair Display', googleFamily: 'Playfair+Display:wght@400;500;600;700;900' },
  { label: 'Merriweather',     value: 'Merriweather',     googleFamily: 'Merriweather:wght@400;700;900' },
] as const

export type FontValue = (typeof FONT_OPTIONS)[number]['value']

// ─── Utilities ────────────────────────────────────────────────────────────────

export function parseTextElement(raw: unknown, defaults: TextElementStyle): TextElementStyle {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults
  const o = raw as Record<string, unknown>
  return {
    size:      typeof o.size      === 'string'  ? o.size      : defaults.size,
    color:     typeof o.color     === 'string'  ? o.color     : defaults.color,
    bold:      typeof o.bold      === 'boolean' ? o.bold      : defaults.bold,
    italic:    typeof o.italic    === 'boolean' ? o.italic    : defaults.italic,
    uppercase: typeof o.uppercase === 'boolean' ? o.uppercase : defaults.uppercase,
  }
}

export function parseEventStyle(raw: unknown): EventStyle {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_STYLE
  const obj = raw as Record<string, unknown>
  const num = (key: string, def: number) =>
    typeof obj[key] === 'number' ? (obj[key] as number) : def

  const rawElements = obj.textElements && typeof obj.textElements === 'object'
    ? (obj.textElements as Record<string, unknown>)
    : {}

  return {
    fontFamily:      typeof obj.fontFamily      === 'string'  ? obj.fontFamily      : DEFAULT_STYLE.fontFamily,
    fontBold:        typeof obj.fontBold        === 'boolean' ? obj.fontBold        : DEFAULT_STYLE.fontBold,
    fontItalic:      typeof obj.fontItalic      === 'boolean' ? obj.fontItalic      : DEFAULT_STYLE.fontItalic,
    primaryColor:    typeof obj.primaryColor    === 'string'  ? obj.primaryColor    : DEFAULT_STYLE.primaryColor,
    primaryAlpha:    num('primaryAlpha',    DEFAULT_STYLE.primaryAlpha),
    accentColor:     typeof obj.accentColor     === 'string'  ? obj.accentColor     : DEFAULT_STYLE.accentColor,
    accentAlpha:     num('accentAlpha',     DEFAULT_STYLE.accentAlpha),
    backgroundColor: typeof obj.backgroundColor === 'string'  ? obj.backgroundColor : DEFAULT_STYLE.backgroundColor,
    backgroundAlpha: num('backgroundAlpha', DEFAULT_STYLE.backgroundAlpha),
    textElements: {
      heading:  parseTextElement(rawElements.heading,  DEFAULT_TEXT_ELEMENTS.heading),
      subtitle: parseTextElement(rawElements.subtitle, DEFAULT_TEXT_ELEMENTS.subtitle),
      label:    parseTextElement(rawElements.label,    DEFAULT_TEXT_ELEMENTS.label),
      body:     parseTextElement(rawElements.body,     DEFAULT_TEXT_ELEMENTS.body),
      code:     parseTextElement(rawElements.code,     DEFAULT_TEXT_ELEMENTS.code),
      score:    parseTextElement(rawElements.score,    DEFAULT_TEXT_ELEMENTS.score),
    },
    adminFontFamily:  typeof obj.adminFontFamily  === 'string' ? obj.adminFontFamily  : DEFAULT_STYLE.adminFontFamily,
    adminAccentColor: typeof obj.adminAccentColor === 'string' ? obj.adminAccentColor : DEFAULT_STYLE.adminAccentColor,
    landingBackgroundImage: typeof obj.landingBackgroundImage === 'string' ? obj.landingBackgroundImage : '',
    landingCtaText:         typeof obj.landingCtaText         === 'string' ? obj.landingCtaText         : '',
    homeAnnouncement:       typeof obj.homeAnnouncement       === 'string' ? obj.homeAnnouncement       : '',
    homeBackgroundImage:    typeof obj.homeBackgroundImage    === 'string' ? obj.homeBackgroundImage    : '',
    showRecoveryCode:    typeof obj.showRecoveryCode    === 'boolean' ? obj.showRecoveryCode    : DEFAULT_STYLE.showRecoveryCode,
    recoveryCodeTitle:   typeof obj.recoveryCodeTitle   === 'string'  ? obj.recoveryCodeTitle   : DEFAULT_STYLE.recoveryCodeTitle,
    recoveryCodeSubtext: typeof obj.recoveryCodeSubtext === 'string'  ? obj.recoveryCodeSubtext : DEFAULT_STYLE.recoveryCodeSubtext,
    showWelcomePage:        typeof obj.showWelcomePage        === 'boolean' ? obj.showWelcomePage        : DEFAULT_STYLE.showWelcomePage,
    welcomeBackgroundImage: typeof obj.welcomeBackgroundImage === 'string'  ? obj.welcomeBackgroundImage : DEFAULT_STYLE.welcomeBackgroundImage,
    welcomeRulesText:       typeof obj.welcomeRulesText       === 'string'  ? obj.welcomeRulesText       : DEFAULT_STYLE.welcomeRulesText,
    welcomeCtaText:         typeof obj.welcomeCtaText         === 'string'  ? obj.welcomeCtaText         : DEFAULT_STYLE.welcomeCtaText,
  }
}

export function getFontUrl(fontFamily: string): string | null {
  const opt = FONT_OPTIONS.find((f) => f.value === fontFamily)
  if (!opt) return null
  return `https://fonts.googleapis.com/css2?family=${opt.googleFamily}&display=swap`
}

export function hexWithOpacity(hex: string, alpha100: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${(alpha100 / 100).toFixed(2)})`
}

/**
 * Returns '#000000' or '#ffffff' — whichever gives better contrast against the
 * given hex background colour (WCAG relative luminance).
 */
export function contrastColor(hex: string): '#000000' | '#ffffff' {
  const clean = hex.replace('#', '')
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const r = toLinear(parseInt(clean.substring(0, 2), 16))
  const g = toLinear(parseInt(clean.substring(2, 4), 16))
  const b = toLinear(parseInt(clean.substring(4, 6), 16))
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.179 ? '#000000' : '#ffffff'
}
