/**
 * Utilities for parsing session log paths from both POSIX and Windows paths.
 */

function splitPathSegments(path: string): string[] {
  return path
    .split(/[\\/]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
}

/** Join the last `count` segments for compact display. */
export function tailPathSegments(path: string, count = 2): string {
  const segments = splitPathSegments(path)
  if (segments.length === 0) return ''
  if (segments.length <= count) return segments.join('/')
  return segments.slice(-count).join('/')
}

function hashPath(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

/** Stable stream session key derived from last two path segments. */
export function sessionWatchIdFromLogPath(path: string): string {
  const segments = splitPathSegments(path)
  const baseTail =
    segments.length === 0
      ? 'session'
      : segments.length === 1
        ? segments[0]
        : `${segments[segments.length - 2]}/${segments[segments.length - 1]}`
  return `${baseTail}#${hashPath(path)}`
}

/** Directory containing the session jsonl file. Preserves original separators. */
export function sessionDirFromLogPath(path: string): string {
  const separatorIndex = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  if (separatorIndex < 0) return '.'
  if (separatorIndex === 2 && /^[A-Za-z]:[\\/]/.test(path)) {
    return path.slice(0, 3)
  }
  if (separatorIndex === 0) return path.slice(0, 1)
  return path.slice(0, separatorIndex)
}

/** Session file id (basename without .jsonl). */
export function sessionFileIdFromLogPath(path: string): string | undefined {
  const file = baseNameFromPath(path)
  if (!file) return undefined
  return file.replace(/\.jsonl$/i, '')
}

/** Session root directory: `<projectDir>/<sessionId>` derived from `<projectDir>/<sessionId>.jsonl`. */
export function sessionRootDirFromLogPath(path: string): string {
  const baseDir = sessionDirFromLogPath(path)
  const sessionId = sessionFileIdFromLogPath(path)
  if (!sessionId) return baseDir

  const separator = path.includes('\\') ? '\\' : '/'
  if (baseDir.endsWith('/') || baseDir.endsWith('\\')) {
    return `${baseDir}${sessionId}`
  }
  return `${baseDir}${separator}${sessionId}`
}

/** File/folder basename from POSIX or Windows path. */
export function baseNameFromPath(path: string): string | undefined {
  const segments = splitPathSegments(path)
  return segments.length > 0 ? segments[segments.length - 1] : undefined
}
