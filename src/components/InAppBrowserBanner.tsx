'use client'

import { useEffect, useState } from 'react'

function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // Known in-app browser signatures
  if (/FBAN|FBAV|Instagram|Twitter|LinkedInApp|Line\/|KAKAOTALK|Snapchat|TikTok|Pinterest/.test(ua)) return true
  // iOS WebView: has AppleWebKit but no Safari token
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua) && /AppleWebKit/.test(ua)) return true
  return false
}

export function InAppBrowserBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(isInAppBrowser())
  }, [])

  if (!show) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-400 text-amber-900 px-4 py-3 text-sm font-medium text-center shadow-md">
      For the best experience, open this page in{' '}
      <strong>Safari</strong> — tap the menu (···) then{' '}
      <strong>Open in Safari</strong>. Sessions may not save in this browser.
    </div>
  )
}
