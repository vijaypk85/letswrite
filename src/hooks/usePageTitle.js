import { useEffect } from 'react'

const SITE_NAME = 'StoryLoom'
const DEFAULT_TITLE = `${SITE_NAME} — read & write short stories`

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE
  }, [title])
}
