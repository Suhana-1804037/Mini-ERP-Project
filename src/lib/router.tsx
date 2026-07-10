import { useEffect, useState } from 'react'

let currentPath = window.location.pathname || '/'
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getCurrentPath() {
  return currentPath
}

export function navigateTo(path: string) {
  currentPath = path
  window.history.pushState({}, '', path)
  emit()
}

export function useRouter() {
  const [route, setRoute] = useState(currentPath)

  useEffect(() => {
    const listener = () => setRoute(currentPath)
    listeners.add(listener)

    const handlePopState = () => {
      currentPath = window.location.pathname || '/'
      emit()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      listeners.delete(listener)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return {
    route,
    navigate: navigateTo,
  }
}

export function Link({ to, children, className, onClick }: { to: string; children: React.ReactNode; className?: string; onClick?: () => void }) {
  const { navigate } = useRouter()

  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault()
        navigate(to)
        onClick?.()
      }}
    >
      {children}
    </a>
  )
}

export function Navigate({ to }: { to: string }) {
  const { navigate } = useRouter()

  useEffect(() => {
    navigate(to)
  }, [navigate, to])

  return null
}
