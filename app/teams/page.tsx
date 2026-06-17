'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface TeamMini { id: string; name: string }

interface OwnedTeam {
  id: string
  name: string
  createdAt: string
  _count: { members: number; sharedApps: number }
}

interface MemberTeam {
  id: string
  joinedAt: string
  team: {
    id: string
    name: string
    createdAt: string
    owner: { id: string; name: string | null; email: string; image: string | null }
    _count: { members: number; sharedApps: number }
  }
}

interface TeamDetail {
  id: string
  name: string
  owner: { id: string; name: string | null; email: string; image: string | null }
  members: Array<{
    id: string
    userId: string
    joinedAt: string
    user: { id: string; name: string | null; email: string; image: string | null }
  }>
  _count: { sharedApps: number }
}

interface SharedApp {
  id: string
  sharedAt: string
  sharedBy: { id: string; name: string | null; email: string; image: string | null }
  application: {
    id: string
    title: string
    companyName: string
    status: string
    city: string | null
    contractType: string
  }
}

function Avatar({ src, name }: { src: string | null; name: string | null | undefined }) {
  if (src) return <Image src={src} alt={name ?? ''} width={28} height={28} className="rounded-full" />
  const initials = (name ?? '?').slice(0, 2).toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
      {initials}
    </div>
  )
}

function TeamCard({
  team,
  isOwner,
  currentUserId,
  onDeleted,
  onLeft,
}: {
  team: OwnedTeam | MemberTeam['team']
  isOwner: boolean
  currentUserId: string
  onDeleted?: () => void
  onLeft?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<TeamDetail | null>(null)
  const [sharedApps, setSharedApps] = useState<SharedApp[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [tab, setTab] = useState<'members' | 'apps'>('members')

  useEffect(() => {
    if (!expanded) return
    setLoadingDetail(true)
    Promise.all([
      fetch(`/api/teams/${team.id}`).then((r) => r.json()),
      fetch(`/api/teams/${team.id}/applications`).then((r) => r.json()),
    ])
      .then(([d, apps]) => {
        setDetail(d)
        setSharedApps(Array.isArray(apps) ? apps : [])
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }, [expanded, team.id])

  async function createInvite() {
    setInviting(true)
    try {
      const res = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail || undefined }),
      })
      const data = await res.json()
      if (res.ok) setInviteUrl(data.joinUrl)
    } catch {}
    setInviting(false)
  }

  async function copyInvite() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(userId: string) {
    setRemoving(userId)
    await fetch(`/api/teams/${team.id}/members/${userId}`, { method: 'DELETE' })
    setDetail((prev) =>
      prev ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) } : prev
    )
    if (userId === currentUserId) onLeft?.()
    setRemoving(null)
  }

  async function deleteTeam() {
    if (!confirm(`Supprimer l'équipe « ${team.name} » ? Cette action est irréversible.`)) return
    await fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
    onDeleted?.()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
            {team.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {team._count.members} membre{team._count.members !== 1 ? 's' : ''} · {team._count.sharedApps} candidature{team._count.sharedApps !== 1 ? 's' : ''} partagée{team._count.sharedApps !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <span className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-medium">
              Propriétaire
            </span>
          )}
          <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-4">
          {loadingDetail && <p className="text-sm text-gray-400">Chargement…</p>}

          {!loadingDetail && detail && (
            <>
              <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 pb-2">
                {(['members', 'apps'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-sm px-3 py-1 rounded-lg font-medium transition-colors ${
                      tab === t
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {t === 'members' ? `Membres (${detail.members.length + 1})` : `Candidatures (${sharedApps.length})`}
                  </button>
                ))}
              </div>

              {tab === 'members' && (
                <div className="space-y-2">
                  {/* Owner row */}
                  <div className="flex items-center gap-3">
                    <Avatar src={detail.owner.image} name={detail.owner.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {detail.owner.name ?? detail.owner.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{detail.owner.email}</p>
                    </div>
                    <span className="text-xs text-brand-600 font-medium">Propriétaire</span>
                  </div>
                  {detail.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <Avatar src={m.user.image} name={m.user.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {m.user.name ?? m.user.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                      </div>
                      {(isOwner || m.userId === currentUserId) && (
                        <button
                          onClick={() => removeMember(m.userId)}
                          disabled={removing === m.userId}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          {m.userId === currentUserId ? 'Quitter' : 'Retirer'}
                        </button>
                      )}
                    </div>
                  ))}

                  {isOwner && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Inviter un membre</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Email (optionnel)"
                          className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                          onClick={createInvite}
                          disabled={inviting}
                          className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                        >
                          {inviting ? '…' : 'Générer lien'}
                        </button>
                      </div>
                      {inviteUrl && (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate font-mono">
                            {inviteUrl}
                          </p>
                          <button
                            onClick={copyInvite}
                            className="text-xs text-brand-600 font-medium shrink-0"
                          >
                            {copied ? '✓ Copié' : 'Copier'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'apps' && (
                <div className="space-y-2">
                  {sharedApps.length === 0 && (
                    <p className="text-sm text-gray-400">Aucune candidature partagée dans cette équipe.</p>
                  )}
                  {sharedApps.map((sa) => (
                    <div
                      key={sa.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {sa.application.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {sa.application.companyName}
                          {sa.application.city ? ` · ${sa.application.city}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          par {sa.sharedBy.name ?? sa.sharedBy.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(sa.sharedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isOwner && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <button
                    onClick={deleteTeam}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Supprimer l&apos;équipe
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TeamsPageInner() {
  const searchParams = useSearchParams()
  const [ownedTeams, setOwnedTeams] = useState<OwnedTeam[]>([])
  const [memberTeams, setMemberTeams] = useState<MemberTeam[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const [teamsRes, sessionRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/auth/session'),
      ])
      const { ownedTeams: owned, memberTeams: member } = await teamsRes.json()
      const sessionData = await sessionRes.json()
      setOwnedTeams(owned ?? [])
      setMemberTeams(member ?? [])
      setCurrentUserId(sessionData?.user?.id ?? '')
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  useEffect(() => {
    if (searchParams.get('joined')) showToast('Équipe rejointe avec succès !')
    if (searchParams.get('already')) showToast('Vous êtes déjà membre de cette équipe.')
    if (searchParams.get('error') === 'invite_expired') showToast('Ce lien d\'invitation a expiré.')
  }, [searchParams])

  async function createTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      })
      if (res.ok) {
        const team = await res.json()
        setOwnedTeams((prev) => [team, ...prev])
        setCreateName('')
        setShowCreate(false)
        showToast('Équipe créée !')
      }
    } catch {}
    setCreating(false)
  }

  const allCount = ownedTeams.length + memberTeams.length

  return (
    <div className="max-w-2xl space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Équipes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Partagez des candidatures avec vos collègues
          </p>
        </div>
        <button
          onClick={() => setShowCreate((x) => !x)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          + Créer une équipe
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createTeam}
          className="bg-white dark:bg-gray-900 rounded-xl border border-brand-200 dark:border-brand-800 p-5 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Nouvelle équipe</p>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nom de l'équipe"
              maxLength={100}
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={creating || !createName.trim()}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? 'Création…' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && allCount === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-3">👥</p>
          <p className="text-sm">Aucune équipe pour l&apos;instant.</p>
          <p className="text-xs mt-1">Créez une équipe et invitez vos collègues.</p>
        </div>
      )}

      {!loading && ownedTeams.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Mes équipes
          </p>
          {ownedTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isOwner
              currentUserId={currentUserId}
              onDeleted={() => setOwnedTeams((prev) => prev.filter((t) => t.id !== team.id))}
            />
          ))}
        </div>
      )}

      {!loading && memberTeams.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Équipes rejointes
          </p>
          {memberTeams.map((mt) => (
            <TeamCard
              key={mt.id}
              team={mt.team}
              isOwner={false}
              currentUserId={currentUserId}
              onLeft={() => setMemberTeams((prev) => prev.filter((m) => m.id !== mt.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeamsPage() {
  return (
    <Suspense>
      <TeamsPageInner />
    </Suspense>
  )
}
