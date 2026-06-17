import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Mes candidatures — 1taff4me',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes candidatures</h1>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          + Nouvelle candidature
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {[
          { id: 'wishlist', label: 'Wishlist', color: 'bg-gray-100' },
          { id: 'to_apply', label: 'À postuler', color: 'bg-blue-50' },
          { id: 'applied', label: 'Postulé', color: 'bg-yellow-50' },
          { id: 'hr_interview', label: 'Entretien RH', color: 'bg-orange-50' },
          { id: 'tech_interview', label: 'Entretien Tech', color: 'bg-purple-50' },
          { id: 'offer', label: 'Offre reçue', color: 'bg-green-50' },
          { id: 'rejected', label: 'Refus', color: 'bg-red-50' },
        ].map((col) => (
          <div key={col.id} className={`flex-shrink-0 w-64 ${col.color} rounded-xl p-3`}>
            <h3 className="font-semibold text-gray-700 text-sm mb-3 px-1">{col.label}</h3>
            <div className="min-h-24 space-y-2">
              <p className="text-xs text-gray-400 text-center pt-6">Kanban à venir (#4)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
