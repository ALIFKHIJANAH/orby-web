// /download streams the newest DMG out of R2. scripts/publish-download.sh in the app repo uploads
// every release as Orby-latest.dmg, carrying the versioned file name in its Content-Disposition.
const LATEST = 'Orby-latest.dmg'

interface Env {
  RELEASES: R2Bucket
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request, waitUntil }) => {
  const file = await env.RELEASES.get(LATEST)
  if (!file) return new Response('Not found', { status: 404 })

  // Counted after the response starts, and a failed insert never breaks the download.
  const name = file.httpMetadata?.contentDisposition?.match(/filename="?([^";]+)/)?.[1] ?? LATEST
  waitUntil(
    env.DB.prepare('INSERT INTO downloads (file, country) VALUES (?, ?)')
      .bind(name, request.cf?.country ?? null)
      .run()
      .catch(() => {}),
  )

  const headers = new Headers()
  file.writeHttpMetadata(headers)
  headers.set('Content-Length', String(file.size))
  headers.set('ETag', file.httpEtag)
  headers.set('Cache-Control', 'public, max-age=300')
  return new Response(file.body, { headers })
}
