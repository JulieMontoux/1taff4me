'use client'

import type React from 'react'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  )
}
