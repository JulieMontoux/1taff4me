'use client'

import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end gap-4 flex-shrink-0">
      {session?.user ? (
        <>
          <span className="text-sm text-gray-500">{session.user.email}</span>
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
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Déconnexion
          </button>
        </>
      ) : null}
    </header>
  )
}
