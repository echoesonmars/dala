"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Navigation } from "@/app/components"

interface Project {
  id: string
  title: string
  subtitle?: string
  description: string
  category: string
  subcategory?: string
  country: string
  currency: string
  location?: string
  goalAmount?: number
  fundingType: string
  durationDays?: number
  deadline?: string
  imageUrl?: string
  videoUrl?: string
  vanitySlug?: string
  shippingType?: string
  entityType?: string
  status: string
  _count: {
    rewardTiers: number
    collaborators: number
  }
}

interface SectionCheck {
  label: string
  done: boolean
}

interface EditorSection {
  href: string
  label: string
  description: string
  checks: SectionCheck[]
}

function getSections(project: Project): EditorSection[] {
  return [
    {
      href: "basics",
      label: "Basics",
      description: "Title, category, image, funding goal, and duration",
      checks: [
        { label: "Title", done: !!project.title && project.title !== "Untitled Project" },
        { label: "Subtitle", done: !!project.subtitle },
        { label: "Category", done: !!project.category },
        { label: "Project image", done: !!project.imageUrl },
        { label: "Goal amount", done: !!project.goalAmount && project.goalAmount > 0 },
        { label: "Duration", done: !!project.durationDays || !!project.deadline },
      ],
    },
    {
      href: "rewards",
      label: "Rewards",
      description: "Define reward tiers and items for backers",
      checks: [
        { label: "At least 1 reward tier", done: project._count.rewardTiers > 0 },
      ],
    },
    {
      href: "story",
      label: "Story",
      description: "Tell backers what you're making and why",
      checks: [
        { label: "Project description", done: !!project.description && project.description.length > 20 },
      ],
    },
    {
      href: "people",
      label: "People",
      description: "Your profile, vanity URL, and team",
      checks: [
        { label: "Vanity URL", done: !!project.vanitySlug },
      ],
    },
    {
      href: "payment",
      label: "Payment",
      description: "Identity verification and payout setup",
      checks: [
        { label: "Project type", done: !!project.entityType },
      ],
    },
  ]
}

function getSectionProgress(section: EditorSection): number {
  if (section.checks.length === 0) return 100
  const done = section.checks.filter((c) => c.done).length
  return Math.round((done / section.checks.length) * 100)
}

function getTotalProgress(sections: EditorSection[]): number {
  const allChecks = sections.flatMap((s) => s.checks)
  if (allChecks.length === 0) return 100
  const done = allChecks.filter((c) => c.done).length
  return Math.round((done / allChecks.length) * 100)
}

export default function ProjectOverviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetch(`/api/projects/${projectId}`)
        .then((r) => r.json())
        .then((d) => {
          setProject(d.project)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status, projectId, router])

  const handleLaunch = async () => {
    setLaunching(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      })
      if (res.ok) {
        setLaunchDialogOpen(false)
        router.push(`/projects/${projectId}`)
      }
    } catch (error) {
      console.error("Launch error:", error)
    } finally {
      setLaunching(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Project not found</h1>
          <Link href="/dashboard"><Button>Go to dashboard</Button></Link>
        </div>
      </div>
    )
  }

  const sections = getSections(project)
  const totalProgress = getTotalProgress(sections)
  const isComplete = totalProgress === 100
  const isLive = project.status === "active"

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm hover:opacity-60 transition-opacity">
            &larr; Back to projects
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{project.title}</h1>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 border border-black">{project.category}</span>
                  <span className={`px-2 py-1 border ${isLive ? "border-black bg-black text-white" : "border-black"}`}>
                    {project.status}
                  </span>
                  <span className="px-2 py-1 border border-black">{project.fundingType}</span>
                </div>
              </div>
              {isLive && (
                <Link href={`/projects/${projectId}`}>
                  <Button variant="outline">View public page</Button>
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {sections.map((section) => {
                const sectionProg = getSectionProgress(section)
                const sectionDone = sectionProg === 100
                return (
                  <Link
                    key={section.href}
                    href={`/dashboard/projects/${projectId}/edit/${section.href}`}
                    className="block border-2 border-black hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 border-2 flex items-center justify-center shrink-0 transition-colors ${
                          sectionDone ? "border-black bg-black text-white" : "border-black"
                        }`}>
                          {sectionDone ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">{sectionProg}%</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-bold">{section.label}</h3>
                            <span className="text-xs text-[#999] shrink-0">{section.checks.filter(c => c.done).length}/{section.checks.length}</span>
                          </div>
                          <p className="text-sm text-[#666]">{section.description}</p>
                        </div>
                        <span className="text-[#999] shrink-0">&rarr;</span>
                      </div>

                      <div className="mt-4 ml-12 space-y-1.5">
                        {section.checks.map((check) => (
                          <div key={check.label} className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${
                              check.done ? "border-black bg-black" : "border-[#ccc]"
                            }`}>
                              {check.done && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="square"/>
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs ${check.done ? "text-black" : "text-[#999]"}`}>
                              {check.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-1 bg-[#eee]">
                      <div
                        className="h-full bg-black transition-all duration-500"
                        style={{ width: `${sectionProg}%` }}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="lg:sticky lg:top-20 space-y-6 self-start">
            <div className="border-2 border-black p-6 space-y-5">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#666]">Overall progress</span>
                  <span className="text-2xl font-bold tabular-nums">{totalProgress}%</span>
                </div>
                <div className="h-3 bg-[#eee]">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {sections.map((section) => {
                  const prog = getSectionProgress(section)
                  const done = prog === 100
                  return (
                    <div key={section.href} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 border flex items-center justify-center ${
                          done ? "border-black bg-black" : "border-[#ccc]"
                        }`}>
                          {done && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="square"/>
                            </svg>
                          )}
                        </div>
                        <span className={done ? "text-black" : "text-[#999]"}>{section.label}</span>
                      </div>
                      <span className={`tabular-nums ${done ? "text-black font-bold" : "text-[#999]"}`}>{prog}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {!isLive && (
              <Dialog open={launchDialogOpen} onOpenChange={setLaunchDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full h-14 text-lg"
                    disabled={!isComplete}
                  >
                    {isComplete ? "Launch project" : `${totalProgress}% complete`}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Launch your project?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-[#666]">
                      Once launched, your project will be publicly visible and backers can start pledging. You can still edit most details after launch.
                    </p>
                    <div className="border-2 border-black p-4">
                      <h3 className="font-bold text-lg mb-1">{project.title}</h3>
                      <div className="flex gap-3 text-xs text-[#666]">
                        <span>{project.category}</span>
                        <span>{project.fundingType}</span>
                        {project.goalAmount && (
                          <span>Goal: {project.goalAmount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setLaunchDialogOpen(false)}>
                        Not yet
                      </Button>
                      <Button className="flex-1" onClick={handleLaunch} disabled={launching}>
                        {launching ? "Launching..." : "Launch now"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isLive && (
              <div className="space-y-3">
                <div className="border-2 border-black bg-black text-white p-4 text-center">
                  <p className="text-sm font-bold">Your project is live</p>
                  <p className="text-xs text-white/60 mt-1">You can still edit details below</p>
                </div>
                <Link href={`/projects/${projectId}`} className="block">
                  <Button variant="outline" size="lg" className="w-full h-14 text-lg">
                    View public page
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
