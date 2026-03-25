import { readdirSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import ImageGrid from './ImageGrid'

function getUploadedImages() {
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  try {
    return readdirSync(uploadDir)
      .filter((f) => !f.startsWith('.'))
      .map((filename) => ({ filename, url: `/uploads/${filename}` }))
      .reverse()
  } catch {
    return []
  }
}

export default function AdminImagesPage() {
  const images = getUploadedImages()

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Admin</Link>
      </div>
      <h1 className="text-2xl font-bold mb-8">Image Library</h1>
      <ImageGrid initial={images} />
    </main>
  )
}
