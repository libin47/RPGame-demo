export interface TextSegment {
  type: 'text' | 'link'
  text: string
  targetId?: string
}

/** Parse [[id|label]] markers into segments. */
export function parseInteractiveText(input: string): TextSegment[] {
  const segments: TextSegment[] = []
  const re = /\[\[([^\]|]+)\|([^\]]+)\]\]/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(input)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', text: input.slice(last, match.index) })
    }
    segments.push({ type: 'link', targetId: match[1], text: match[2]! })
    last = match.index + match[0].length
  }
  if (last < input.length) {
    segments.push({ type: 'text', text: input.slice(last) })
  }
  return segments
}
