"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation, Footer } from "@/app/components"

interface PostAuthor {
  id: string
  name?: string
  username?: string
  image?: string
}

interface PostProject {
  id: string
  title: string
  subtitle?: string
  category: string
  imageUrl?: string
  currency: string
  goalAmount?: number
  status: string
  vanitySlug?: string
}

interface Post {
  id: string
  content: string
  images: string[]
  createdAt: string
  author: PostAuthor
  project?: PostProject | null
}

interface TrendingProject {
  id: string
  title: string
  subtitle?: string
  category: string
  imageUrl?: string
  currency: string
  goalAmount?: number
  vanitySlug?: string
  user: { name?: string; username?: string }
  _count: { pledges: number }
}

const currencySymbols: Record<string, string> = {
  KZT: "₸", RUB: "₽", UAH: "₴", BYN: "Br",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [posts, setPosts] = useState<Post[]>([])
  const [trendingProjects, setTrendingProjects] = useState<TrendingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }
    if (status === "authenticated") {
      fetchFeed()
    }
  }, [status, router])

  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      const url = cursor ? `/api/feed?cursor=${cursor}` : "/api/feed"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (cursor) {
          setPosts((prev) => [...prev, ...data.posts])
        } else {
          setPosts(data.posts)
          setTrendingProjects(data.trendingProjects || [])
        }
        setNextCursor(data.nextCursor)
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const loadMore = () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    fetchFeed(nextCursor)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const username = (session?.user as Record<string, unknown>)?.username as string | undefined

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Your feed</h1>
              <Link href="/browse">
                <Button variant="outline" size="sm">Discover projects</Button>
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="border-2 border-black p-12 text-center">
                <h3 className="text-xl font-bold mb-3">Your feed is empty</h3>
                <p className="text-[#666] mb-6 text-sm max-w-md mx-auto">
                  Follow creators, back projects, and your feed will come alive with updates and announcements.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/browse">
                    <Button>Browse projects</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="border-2 border-black p-6 hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Link
                        href={post.author.username ? `/u/${post.author.username}` : "#"}
                        className="shrink-0"
                      >
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-sm font-bold">
                          {post.author.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <Link
                            href={post.author.username ? `/u/${post.author.username}` : "#"}
                            className="font-bold text-sm hover:opacity-60 transition-opacity"
                          >
                            {post.author.name || "Anonymous"}
                          </Link>
                          {post.author.username && (
                            <span className="text-xs text-[#999] font-mono">@{post.author.username}</span>
                          )}
                          <span className="text-xs text-[#999]">{timeAgo(post.createdAt)}</span>
                        </div>

                        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

                        {post.images && post.images.length > 0 && (
                          <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                            {post.images.map((img, i) => (
                              <div key={i} className="border border-[#e5e5e5] overflow-hidden">
                                <img
                                  src={img}
                                  alt=""
                                  className="w-full h-48 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {post.project && (
                          <Link
                            href={`/projects/${post.project.vanitySlug || post.project.id}`}
                            className="block border border-[#e5e5e5] hover:border-black transition-colors"
                          >
                            <div className="flex items-center gap-4 p-3">
                              {post.project.imageUrl ? (
                                <div className="w-12 h-12 shrink-0 overflow-hidden border border-[#e5e5e5]">
                                  <img src={post.project.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 shrink-0 bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center">
                                  <span className="text-[#ccc] text-xs">No img</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{post.project.title}</p>
                                <div className="flex gap-2 mt-0.5">
                                  <span className="text-xs px-1.5 py-0.5 border border-[#ccc]">{post.project.category}</span>
                                  {post.project.goalAmount && (
                                    <span className="text-xs text-[#666]">
                                      Goal: {currencySymbols[post.project.currency] || "$"}{post.project.goalAmount.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                ))}

                {nextCursor && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <aside className="space-y-8 hidden lg:block">
            <div className="border-2 border-black p-5">
              <Link
                href={username ? `/u/${username}` : "/dashboard"}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {session?.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold">{session?.user?.name || "Anonymous"}</p>
                  {username && <p className="text-xs text-[#666] font-mono">@{username}</p>}
                </div>
              </Link>
              <div className="flex gap-3 mt-4">
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">Dashboard</Button>
                </Link>
                <Link href="/start" className="flex-1">
                  <Button size="sm" className="w-full text-xs">Start project</Button>
                </Link>
              </div>
            </div>
            {trendingProjects.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#666] mb-4">Trending projects</h3>
                <div className="space-y-3">
                  {trendingProjects.map((proj) => {
                    const sym = currencySymbols[proj.currency] || "$"
                    return (
                      <Link
                        key={proj.id}
                        href={`/projects/${proj.vanitySlug || proj.id}`}
                        className="block border border-[#e5e5e5] hover:border-black transition-colors p-4"
                      >
                        <div className="flex gap-3">
                          {proj.imageUrl ? (
                            <div className="w-14 h-14 shrink-0 overflow-hidden border border-[#e5e5e5]">
                              <img src={proj.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 shrink-0 bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center">
                              <span className="text-[#ccc] text-[10px]">No img</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{proj.title}</p>
                            <p className="text-xs text-[#666] truncate">
                              by {proj.user.name || proj.user.username || "Anonymous"}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs px-1.5 py-0.5 border border-[#ccc]">{proj.category}</span>
                              <span className="text-xs text-[#666]">
                                {proj._count.pledges} backer{proj._count.pledges !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <Link href="/browse" className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Browse all projects
                  </Button>
                </Link>
              </div>
            )}
            <div className="space-y-2 text-xs text-[#999]">
              <div className="flex gap-3">
                <Link href="/how-it-works" className="hover:text-black transition-colors">How it works</Link>
                <Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link>
                <Link href="/browse" className="hover:text-black transition-colors">Browse</Link>
              </div>
              <p>&copy; {new Date().getFullYear()} dala</p>
            </div>
          </aside>
        </div>
      </main>

      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  )
}
