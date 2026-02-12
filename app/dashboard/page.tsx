"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navigation } from "@/app/components"

const categories = [
  { id: "technology", label: "Technology" },
  { id: "social", label: "Social Projects" },
  { id: "art", label: "Art" },
  { id: "food", label: "Food" },
  { id: "games", label: "Games" },
  { id: "publishing", label: "Publishing" },
  { id: "fashion", label: "Fashion" },
]

const countries = [
  { id: "KZ", label: "Kazakhstan", currency: "KZT" },
  { id: "RU", label: "Russia", currency: "RUB" },
  { id: "UA", label: "Ukraine", currency: "UAH" },
  { id: "BY", label: "Belarus", currency: "BYN" },
]

const currencySymbols: Record<string, string> = { KZT: "₸", RUB: "₽", UAH: "₴", BYN: "Br" }

interface Project {
  id: string
  title: string
  status: string
  category: string
  createdAt: string
  imageUrl?: string
  goalAmount?: number
  currency: string
}

interface BackedPledge {
  id: string
  amount: number
  status: string
  createdAt: string
  project: {
    id: string
    title: string
    category: string
    status: string
    currency: string
    imageUrl?: string
    user: { name?: string }
  }
}

type Tab = "overview" | "projects" | "backed"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const [projects, setProjects] = useState<Project[]>([])
  const [pledges, setPledges] = useState<BackedPledge[]>([])
  const [totalBacked, setTotalBacked] = useState(0)
  const [loading, setLoading] = useState(true)
  const [backedLoading, setBackedLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({ category: "", country: "" })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProjects()
      fetchPledges()
    }
  }, [status])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      if (response.ok) setProjects(data.projects)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPledges = async () => {
    setBackedLoading(true)
    try {
      const response = await fetch("/api/user/pledges")
      const data = await response.json()
      if (response.ok) {
        setPledges(data.pledges)
        setTotalBacked(data.totalBacked)
      }
    } catch (error) {
      console.error("Error fetching pledges:", error)
    } finally {
      setBackedLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.category || !newProject.country) return
    setCreating(true)
    const country = countries.find((c) => c.id === newProject.country)
    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newProject.category,
          country: newProject.country,
          currency: country?.currency || "KZT",
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setCreateOpen(false)
        setNewProject({ category: "", country: "" })
        router.push(`/dashboard/projects/${data.projectId}`)
      }
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setCreating(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[#666]">Loading...</p>
        </div>
      </div>
    )
  }

  const userExt = session?.user as Record<string, unknown> | undefined
  const username = userExt?.username as string | undefined
  const createdAt = userExt?.createdAt as string | undefined

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : username?.[0]?.toUpperCase() || "?"

  const activeProjects = projects.filter((p) => p.status === "active").length
  const draftProjects = projects.filter((p) => p.status === "draft").length

  const createProjectDialog = (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger asChild>
        <Button>Create project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold">Category</label>
            <Select value={newProject.category} onValueChange={(v) => setNewProject({ ...newProject, category: v })}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent position="popper">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold">Country</label>
            <Select value={newProject.country} onValueChange={(v) => setNewProject({ ...newProject, country: v })}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent position="popper">
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleCreateProject}
            disabled={!newProject.category || !newProject.country || creating}
            className="w-full"
          >
            {creating ? "Creating..." : "Create project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-black text-white flex items-center justify-center text-3xl md:text-4xl font-bold shrink-0">
              {initials}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
                {session?.user?.name || "Anonymous"}
              </h1>
              <div className="flex items-center gap-3 mb-3">
                {username && (
                  <Link href={`/u/${username}`} className="text-sm font-mono text-[#666] hover:text-black transition-colors">
                    @{username}
                  </Link>
                )}
                <span className="text-xs text-[#999]">{session?.user?.email}</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="text-[#999]">Member since {memberSince}</span>
                <span className="text-[#999]">&middot;</span>
                <span>{projects.length} project{projects.length !== 1 ? "s" : ""} created</span>
                <span className="text-[#999]">&middot;</span>
                <span>{pledges.length} project{pledges.length !== 1 ? "s" : ""} backed</span>
              </div>
            </div>

            <div className="flex gap-3 shrink-0">
              <Link href="/settings">
                <Button variant="outline">Edit profile</Button>
              </Link>
              {createProjectDialog}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#e5e5e5]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex gap-0">
          {[
            { key: "overview" as Tab, label: "Overview" },
            { key: "projects" as Tab, label: `Your projects (${projects.length})` },
            { key: "backed" as Tab, label: `Backed (${pledges.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? "border-black text-black" : "border-transparent text-[#999] hover:text-black"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
        {tab === "overview" && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-black p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-[#999] mb-2">Created</div>
                <div className="text-3xl font-bold tabular-nums">{projects.length}</div>
              </div>
              <div className="border-2 border-black p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-[#999] mb-2">Active</div>
                <div className="text-3xl font-bold tabular-nums">{activeProjects}</div>
              </div>
              <div className="border-2 border-black p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-[#999] mb-2">Backed</div>
                <div className="text-3xl font-bold tabular-nums">{pledges.length}</div>
              </div>
              <div className="border-2 border-black p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-[#999] mb-2">Total pledged</div>
                <div className="text-3xl font-bold tabular-nums">{totalBacked > 0 ? totalBacked.toLocaleString() : "0"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-black p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Creator</h3>
                    <p className="text-sm text-[#666]">Launch and manage crowdfunding campaigns</p>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                {projects.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {projects.slice(0, 3).map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="block p-3 border border-[#e5e5e5] hover:border-black transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{project.title}</span>
                          <span className="text-xs px-2 py-0.5 border border-[#ccc] shrink-0 ml-3">{project.status}</span>
                        </div>
                      </Link>
                    ))}
                    {projects.length > 3 && (
                      <button onClick={() => setTab("projects")} className="text-xs text-[#999] hover:text-black transition-colors">
                        View all {projects.length} projects
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#999] mb-6">No projects yet. Ready to launch your first campaign?</p>
                )}
                {createProjectDialog}
              </div>

              <div className="border-2 border-black p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Backer</h3>
                    <p className="text-sm text-[#666]">Support projects you believe in</p>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                {pledges.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {pledges.slice(0, 3).map((pledge) => {
                      const sym = currencySymbols[pledge.project.currency] || "$"
                      return (
                        <Link
                          key={pledge.id}
                          href={`/projects/${pledge.project.id}`}
                          className="block p-3 border border-[#e5e5e5] hover:border-black transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{pledge.project.title}</span>
                            <span className="text-sm font-bold shrink-0 ml-3">{sym}{pledge.amount.toLocaleString()}</span>
                          </div>
                        </Link>
                      )
                    })}
                    {pledges.length > 3 && (
                      <button onClick={() => setTab("backed")} className="text-xs text-[#999] hover:text-black transition-colors">
                        View all {pledges.length} pledges
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#999] mb-6">You haven&apos;t backed any projects yet.</p>
                )}
                <Link href="/browse">
                  <Button variant="outline">Discover projects</Button>
                </Link>
              </div>
            </div>

            {draftProjects > 0 && (
              <div className="border-2 border-dashed border-[#ccc] p-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">You have {draftProjects} draft project{draftProjects !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-[#999] mt-1">Finish setting up and launch when ready.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTab("projects")}>
                  View drafts
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === "projects" && (
          <>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your projects</h2>
                <p className="text-sm text-[#666]">Campaigns you&apos;ve created</p>
              </div>
              {createProjectDialog}
            </div>

            {projects.length === 0 ? (
              <div className="border-2 border-black p-12 text-center">
                <h3 className="text-xl font-bold mb-3">No projects yet</h3>
                <p className="text-[#666] mb-6 text-sm">Start your first crowdfunding campaign</p>
                {createProjectDialog}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => {
                  const sym = currencySymbols[project.currency] || "$"
                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="block border-2 border-black p-5 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-5">
                        {project.imageUrl ? (
                          <div className="w-16 h-16 border border-[#e5e5e5] shrink-0 overflow-hidden">
                            <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-[#fafafa] border border-[#e5e5e5] shrink-0 flex items-center justify-center">
                            <span className="text-[#ccc] text-xs">No img</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold truncate">{project.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 border border-[#ccc]">{project.category}</span>
                            <span className={`text-xs px-2 py-0.5 border ${
                              project.status === "active" ? "border-black bg-black text-white" : "border-[#ccc]"
                            }`}>{project.status}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {project.goalAmount ? (
                            <div className="text-sm font-bold">{sym}{project.goalAmount.toLocaleString()}</div>
                          ) : null}
                          <div className="text-xs text-[#999]">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === "backed" && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-1">Backed projects</h2>
              <p className="text-sm text-[#666]">Projects you&apos;ve supported</p>
            </div>

            {totalBacked > 0 && (
              <div className="border-2 border-black p-6 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#999] mb-1">Total pledged</div>
                  <div className="text-3xl font-bold tabular-nums">{totalBacked.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#999] mb-1">Projects</div>
                  <div className="text-3xl font-bold tabular-nums">{pledges.length}</div>
                </div>
              </div>
            )}

            {backedLoading ? (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pledges.length === 0 ? (
              <div className="border-2 border-black p-12 text-center">
                <h3 className="text-xl font-bold mb-3">No pledges yet</h3>
                <p className="text-[#666] mb-6 text-sm">Back a project and it&apos;ll show up here</p>
                <Link href="/browse">
                  <Button>Browse projects</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pledges.map((pledge) => {
                  const sym = currencySymbols[pledge.project.currency] || "$"
                  return (
                    <Link
                      key={pledge.id}
                      href={`/projects/${pledge.project.id}`}
                      className="block border-2 border-black p-5 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold truncate">{pledge.project.title}</h3>
                          <p className="text-xs text-[#666] mt-1">
                            by {pledge.project.user.name || "Anonymous"}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 border border-[#ccc]">{pledge.project.category}</span>
                            <span className="text-xs px-2 py-0.5 border border-[#ccc]">{pledge.project.status}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-xl font-bold">{sym}{pledge.amount.toLocaleString()}</div>
                          <div className="text-xs text-[#999]">
                            {new Date(pledge.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
