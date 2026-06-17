'use client'

import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-end gap-3 flex-shrink-0">
      <ThemeToggle />
      {session?.user ? (
        <>
          <span className="text-sm text-gray-500 dark:text-gray-400">{session.user.email}</span>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Déconnexion
          </button>
        </>
      ) : null}
    </header>
  )
}
