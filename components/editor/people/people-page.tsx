"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Collaborator {
  id: string
  email: string
  role: string
  status: string
}

interface PeoplePageProps {
  projectId: string
  vanitySlug?: string | null
  onSlugChange?: (slug: string | null) => void
}

export function PeoplePage({ projectId, vanitySlug, onSlugChange }: PeoplePageProps) {
  const { data: session } = useSession()
  const [slug, setSlug] = useState(vanitySlug || "")
  const [slugSaved, setSlugSaved] = useState(false)
  const [slugError, setSlugError] = useState("")
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("EDITOR")
  const [loading, setLoading] = useState(true)

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`)
      if (res.ok) {
        const data = await res.json()
        setCollaborators(data.collaborators || [])
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchCollaborators() }, [fetchCollaborators])

  const saveSlug = async () => {
    setSlugError("")
    if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 3) {
      setSlugError("Only lowercase letters, numbers, and dashes. Min 3 characters.")
      return
    }
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vanitySlug: slug }),
    })
    if (res.ok) {
      setSlugSaved(true)
      onSlugChange?.(slug)
      setTimeout(() => setSlugSaved(false), 2000)
    }
  }

  const inviteCollaborator = async () => {
    const res = await fetch(`/api/projects/${projectId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    if (res.ok) {
      setInviteEmail("")
      setInviteRole("EDITOR")
      setInviteOpen(false)
      fetchCollaborators()
    }
  }

  const removeCollaborator = async (id: string) => {
    await fetch(`/api/projects/${projectId}/collaborators/${id}`, { method: "DELETE" })
    fetchCollaborators()
  }

  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Your profile</h2>
          <p className="text-sm text-[#666]">
            This is how you appear to backers.
          </p>
        </div>

        <div className="border-2 border-black p-6 flex items-center gap-6">
          <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{session?.user?.name || "Anonymous"}</p>
            <p className="text-sm text-[#666]">{session?.user?.email}</p>
            <p className="text-xs text-[#999] mt-1">Project Creator</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Vanity URL</h2>
          <p className="text-sm text-[#666]">
            Set a custom URL for your project page.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Project URL</Label>
          <div className="flex">
            <span className="inline-flex items-center px-4 border-2 border-r-0 border-black bg-[#fafafa] text-sm text-[#666] whitespace-nowrap">
              dala.works/projects/
            </span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase())
                setSlugSaved(false)
              }}
              placeholder="my-project"
              className="border-l-0"
              maxLength={30}
            />
          </div>
          {slugError && <p className="text-xs text-black">{slugError}</p>}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={saveSlug} disabled={!slug}>
              {slugSaved ? "Saved" : "Confirm"}
            </Button>
            <span className="text-xs text-[#999]">{slug.length}/30</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Collaborators</h2>
          <p className="text-sm text-[#666]">
            Invite team members to help manage your project.
          </p>
        </div>

        {!session?.user?.email ? (
          <div className="border-2 border-black bg-[#fafafa] p-6">
            <p className="font-bold mb-1">Verify your email first</p>
            <p className="text-sm text-[#666] mb-4">
              You need to verify your email before adding collaborators.
            </p>
            <Button variant="outline" size="sm">Send verification email</Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button>+ Invite collaborator</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite collaborator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5 pt-4">
                    <div className="space-y-2">
                      <Label>Email address</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="teammate@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setInviteRole("EDITOR")}
                          className={`w-full text-left p-4 border-2 transition-colors ${inviteRole === "EDITOR" ? "border-black bg-[#fafafa]" : "border-[#e5e5e5] hover:border-[#999]"}`}
                        >
                          <p className="font-bold text-sm">Editor</p>
                          <p className="text-xs text-[#666] mt-1">Can edit project details, rewards, story, and manage settings. Full access except payment info.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteRole("VIEWER")}
                          className={`w-full text-left p-4 border-2 transition-colors ${inviteRole === "VIEWER" ? "border-black bg-[#fafafa]" : "border-[#e5e5e5] hover:border-[#999]"}`}
                        >
                          <p className="font-bold text-sm">Viewer</p>
                          <p className="text-xs text-[#666] mt-1">Read-only access. Can see project analytics and backer data but cannot make changes.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteRole("SUPPORT")}
                          className={`w-full text-left p-4 border-2 transition-colors ${inviteRole === "SUPPORT" ? "border-black bg-[#fafafa]" : "border-[#e5e5e5] hover:border-[#999]"}`}
                        >
                          <p className="font-bold text-sm">Support</p>
                          <p className="text-xs text-[#666] mt-1">Can respond to backer messages and manage fulfillment. No access to project editing.</p>
                        </button>
                      </div>
                    </div>
                    <Button onClick={inviteCollaborator} disabled={!inviteEmail} className="w-full">
                      Send invite
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="border-2 border-dashed border-[#ccc] p-8 text-center">
                <p className="text-[#999]">You're the only one here</p>
                <p className="text-xs text-[#999] mt-1">Invite collaborators to help manage this project.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((c) => (
                  <div key={c.id} className="border-2 border-black p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{c.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 border border-[#ccc]">{c.role}</span>
                        <span className="text-xs px-2 py-0.5 border border-[#ccc]">{c.status}</span>
                      </div>
                    </div>
                    <button onClick={() => removeCollaborator(c.id)} className="text-xs hover:opacity-60 transition-opacity">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
