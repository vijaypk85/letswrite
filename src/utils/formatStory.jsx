// Renders a small, safe subset of markdown: **bold** and *italic*.
// Used by the Write page's Preview toggle and the Story detail page, so
// stories written with the formatting toolbar look the same in both places.
// Deliberately not full markdown — just enough to support the toolbar.
export function renderFormattedText(text) {
  if (!text) return null

  const nodes = []
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      nodes.push(<em key={key++}>{match[2]}</em>)
    }
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}
