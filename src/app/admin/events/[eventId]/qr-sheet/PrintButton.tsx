'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded bg-black px-4 py-2 text-white text-sm"
    >
      Print QR Sheet
    </button>
  )
}
