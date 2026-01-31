import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // SSR에서는 false로 시작하여 hydration 미스매치 방지
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isHydrated, setIsHydrated] = React.useState<boolean>(false)

  React.useEffect(() => {
    setIsHydrated(true)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = React.useState<boolean>(false)

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}
