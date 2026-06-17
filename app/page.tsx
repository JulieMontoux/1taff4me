import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-gray-900 mb-3">1taff4me</h1>
        <p className="text-xl text-gray-500">Ton assistant de recherche d&apos;emploi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mb-10">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-left">
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-semibold text-gray-900 mb-1">Recherche géo-métier</h3>
          <p className="text-sm text-gray-500">Trouve les entreprises par ville et domaine</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-left">
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-semibold text-gray-900 mb-1">Kanban candidatures</h3>
          <p className="text-sm text-gray-500">Suis ton pipeline de bout en bout</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-left">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900 mb-1">Stats & rappels</h3>
          <p className="text-sm text-gray-500">Analyse ton taux de réponse, relance au bon moment</p>
        </div>
      </div>

      <Link
        href="/auth/signin"
        className="px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
      >
        Commencer
      </Link>
    </div>
  )
}
