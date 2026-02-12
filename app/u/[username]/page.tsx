"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Navigation, Footer } from "@/app/components"
import { useUploadThing } from "@/lib/uploadthing"

interface ProfileUser {
  id: string
  name: string | null
  username: string
  image: string | null
  bio: string | null
  interests: string[]
  createdAt: string
  _count: {
    followers: number
    following: number
    projects: number
    pledges: number
  }
  projects: {
    id: string
    title: string
    subtitle: string | null
    category: string
    imageUrl: string | null
    currency: string
    goalAmount: number | null
    createdAt: string
  }[]
}

interface FollowUser {
  id: string
  name: string | null
  username: string
  image: string | null
  bio: string | null
}

interface PostProject {
  id: string
  title: string
  subtitle: string | null
  category: string
  imageUrl: string | null
  currency: string
  goalAmount: number | null
  status: string
}

interface PostData {
  id: string
  content: string
  images: string[]
  createdAt: string
  author: { id: string; name: string | null; username: string; image: string | null }
  project: PostProject | null
}

type ProfileTab = "posts" | "projects"

const currencySymbols: Record<string, string> = { KZT: "₸", RUB: "₽", UAH: "₴", BYN: "Br" }

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const usernameParam = params.username as string

  const [user, setUser] = useState<ProfileUser | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [listType, setListType] = useState<"followers" | "following">("followers")
  const [listUsers, setListUsers] = useState<FollowUser[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [tab, setTab] = useState<ProfileTab>("posts")

  const [posts, setPosts] = useState<PostData[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [postsLoaded, setPostsLoaded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setPostsLoaded(false)
    setPosts([])
    setNextCursor(null)
    fetch(`/api/users/${usernameParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user)
          setIsFollowing(d.isFollowing)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [usernameParam])

  const loadPosts = useCallback(async (cursor?: string | null) => {
    setPostsLoading(true)
    try {
      const url = `/api/posts?username=${usernameParam}${cursor ? `&cursor=${cursor}` : ""}`
      const res = await fetch(url)
      const data = await res.json()
      if (cursor) {
        setPosts((prev) => [...prev, ...(data.posts || [])])
      } else {
        setPosts(data.posts || [])
      }
      setNextCursor(data.nextCursor || null)
      setPostsLoaded(true)
    } catch {
      setPostsLoaded(true)
    } finally {
      setPostsLoading(false)
    }
  }, [usernameParam])

  useEffect(() => {
    if (!loading && user && !postsLoaded) {
      loadPosts()
    }
  }, [loading, user, postsLoaded, loadPosts])

  const toggleFollow = async () => {
    if (!session?.user) {
      router.push("/login")
      return
    }
    setFollowLoading(true)
    const method = isFollowing ? "DELETE" : "POST"
    const res = await fetch(`/api/users/${usernameParam}/follow`, { method })
    if (res.ok) {
      const data = await res.json()
      setIsFollowing(data.following)
      setUser((prev) =>
        prev
          ? { ...prev, _count: { ...prev._count, followers: prev._count.followers + (data.following ? 1 : -1) } }
          : prev
      )
    }
    setFollowLoading(false)
  }

  const openList = async (type: "followers" | "following") => {
    setListType(type)
    setListOpen(true)
    setListLoading(true)
    try {
      const res = await fetch(`/api/users/${usernameParam}/followers?type=${type}`)
      const data = await res.json()
      setListUsers(data.users || [])
    } catch {
      setListUsers([])
    } finally {
      setListLoading(false)
    }
  }

  const handlePostCreated = (post: PostData) => {
    setPosts((prev) => [post, ...prev])
  }

  const handleDeletePost = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    }
  }

  const isOwnProfile = session?.user?.id === user?.id

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-32 text-center">
          <div>
            <h1 className="text-4xl font-bold mb-3">User not found</h1>
            <p className="text-[#666] mb-6">No one goes by that username.</p>
            <Link href="/browse"><Button>Browse projects</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.username[0].toUpperCase()

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="border-b-2 border-black">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="w-24 h-24 bg-black text-white flex items-center justify-center text-4xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {user.name || user.username}
              </h1>
              <p className="text-[#666] font-mono mt-1">@{user.username}</p>
              {user.bio && <p className="text-sm text-[#666] mt-3 max-w-lg">{user.bio}</p>}

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm">
                <button onClick={() => openList("followers")} className="hover:opacity-60 transition-opacity">
                  <span className="font-bold">{user._count.followers}</span>{" "}
                  <span className="text-[#999]">followers</span>
                </button>
                <button onClick={() => openList("following")} className="hover:opacity-60 transition-opacity">
                  <span className="font-bold">{user._count.following}</span>{" "}
                  <span className="text-[#999]">following</span>
                </button>
                <span className="text-[#999]">&middot;</span>
                <span>
                  <span className="font-bold">{user._count.projects}</span>{" "}
                  <span className="text-[#999]">projects</span>
                </span>
                <span className="text-[#999]">&middot;</span>
                <span>
                  <span className="font-bold">{user._count.pledges}</span>{" "}
                  <span className="text-[#999]">backed</span>
                </span>
                <span className="text-[#999]">&middot;</span>
                <span className="text-[#999]">Joined {memberSince}</span>
              </div>
            </div>

            {!isOwnProfile && (
              <Button
                onClick={toggleFollow}
                variant={isFollowing ? "outline" : "default"}
                disabled={followLoading}
                className="shrink-0"
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {isOwnProfile && (
              <div className="flex gap-2 shrink-0">
                <Link href="/settings"><Button variant="outline">Edit profile</Button></Link>
                <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {user.interests && user.interests.length > 0 && (
        <div className="border-b border-[#e5e5e5]">
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-5">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#999] self-center mr-2">Interests</span>
              {user.interests.map((interest) => (
                <span key={interest} className="px-3 py-1 text-xs border border-[#e5e5e5] bg-[#fafafa]">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-[#e5e5e5]">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 flex gap-0">
          {[
            { key: "posts" as ProfileTab, label: "Posts" },
            { key: "projects" as ProfileTab, label: `Projects (${user.projects.length})` },
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

      <main className="max-w-[900px] mx-auto px-4 md:px-6 py-10">
        {tab === "posts" && (
          <div className="max-w-[600px] mx-auto space-y-6">
            {isOwnProfile && (
              <PostComposer
                projects={user.projects}
                onPostCreated={handlePostCreated}
              />
            )}

            {postsLoading && posts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : posts.length === 0 ? (
              <div className="border-2 border-dashed border-[#ccc] p-12 text-center">
                <p className="text-[#999]">
                  {isOwnProfile ? "No posts yet. Share something with your followers." : "No posts yet."}
                </p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={isOwnProfile}
                    onDelete={() => handleDeletePost(post.id)}
                  />
                ))}
                {nextCursor && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => loadPosts(nextCursor)} disabled={postsLoading}>
                      {postsLoading ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "projects" && (
          <>
            {user.projects.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.projects.map((project) => {
                    const sym = currencySymbols[project.currency] || "$"
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block border-2 border-black hover:bg-[#fafafa] transition-colors overflow-hidden"
                      >
                        {project.imageUrl && (
                          <div className="w-full aspect-video bg-[#f5f5f5]">
                            <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="font-bold text-lg mb-1">{project.title}</h3>
                          {project.subtitle && (
                            <p className="text-sm text-[#666] mb-3 line-clamp-2">{project.subtitle}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs">
                            <span className="px-2 py-0.5 border border-[#ccc]">{project.category}</span>
                            {project.goalAmount && (
                              <span className="text-[#666]">{sym}{project.goalAmount.toLocaleString()} goal</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#ccc] p-12 text-center">
                <p className="text-[#999]">
                  {isOwnProfile ? "You haven't launched any public projects yet." : "No public projects yet."}
                </p>
                {isOwnProfile && (
                  <Link href="/dashboard" className="inline-block mt-4">
                    <Button variant="outline">Go to dashboard</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{listType === "followers" ? "Followers" : "Following"}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {listLoading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : listUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#999]">
                {listType === "followers" ? "No followers yet" : "Not following anyone yet"}
              </p>
            ) : (
              <div className="space-y-1 py-2">
                {listUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/u/${u.username}`}
                    onClick={() => setListOpen(false)}
                    className="flex items-center gap-3 p-3 hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {u.name?.[0]?.toUpperCase() || u.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{u.name || u.username}</p>
                      <p className="text-xs text-[#999] font-mono">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

interface PostComposerProps {
  projects: ProfileUser["projects"]
  onPostCreated: (post: PostData) => void
}

function PostComposer({ projects, onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing("postImage")

  const handleImageUpload = async (files: FileList) => {
    const remaining = 4 - images.length
    if (remaining <= 0) return
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remaining)
    if (imageFiles.length === 0) return
    setUploading(true)
    try {
      const res = await startUpload(imageFiles)
      if (res) {
        const urls = res.map((r) => r.url)
        setImages((prev) => [...prev, ...urls])
      }
    } catch {
      /* skip */
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return
    setPosting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          images,
          projectId: selectedProjectId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onPostCreated(data.post)
        setContent("")
        setImages([])
        setSelectedProjectId(null)
        setShowProjects(false)
      }
    } catch {
      /* skip */
    } finally {
      setPosting(false)
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div className="border-2 border-black">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share an update, announce your project, or say hi..."
        maxLength={2000}
        rows={3}
        className="w-full px-5 pt-5 pb-3 text-sm resize-none focus:outline-none placeholder:text-[#999]"
      />

      {images.length > 0 && (
        <div className="px-5 pb-3">
          <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {images.map((url, i) => (
              <div key={i} className="relative group aspect-video bg-[#f5f5f5]">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="px-5 pb-3">
          <div className="border border-[#e5e5e5] p-3 flex items-center gap-3">
            {selectedProject.imageUrl && (
              <div className="w-12 h-12 bg-[#f5f5f5] shrink-0">
                <img src={selectedProject.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{selectedProject.title}</p>
              <p className="text-xs text-[#999]">{selectedProject.category}</p>
            </div>
            <button
              onClick={() => setSelectedProjectId(null)}
              className="text-xs text-[#999] hover:text-black transition-colors shrink-0"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showProjects && !selectedProjectId && projects.length > 0 && (
        <div className="px-5 pb-3">
          <p className="text-xs font-bold mb-2">Embed a project</p>
          <div className="border border-[#e5e5e5] max-h-[200px] overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProjectId(p.id); setShowProjects(false) }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#fafafa] transition-colors flex items-center gap-3 border-b border-[#f0f0f0] last:border-0"
              >
                {p.imageUrl ? (
                  <div className="w-8 h-8 bg-[#f5f5f5] shrink-0">
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-[#f5f5f5] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-[#999]">{p.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[#e5e5e5] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= 4}
            className="p-2 hover:bg-[#fafafa] transition-colors disabled:opacity-30"
            title="Add image (max 4)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="0"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
          </button>
          {projects.length > 0 && (
            <button
              onClick={() => setShowProjects(!showProjects)}
              disabled={!!selectedProjectId}
              className="p-2 hover:bg-[#fafafa] transition-colors disabled:opacity-30"
              title="Embed a project"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
          )}
          {uploading && <span className="text-xs text-[#999] ml-2">Uploading...</span>}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#999]">{content.length}/2000</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={posting || (!content.trim() && images.length === 0)}
            className="h-8"
          >
            {posting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface PostCardProps {
  post: PostData
  isOwner: boolean
  onDelete: () => void
}

function PostCard({ post, isOwner, onDelete }: PostCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  const timeAgo = getTimeAgo(new Date(post.createdAt))
  const sym = post.project ? currencySymbols[post.project.currency] || "$" : "$"

  return (
    <>
      <div className="border-2 border-black">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <Link href={`/u/${post.author.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                {post.author.name?.[0]?.toUpperCase() || post.author.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">{post.author.name || post.author.username}</p>
                <p className="text-xs text-[#999] font-mono">@{post.author.username} &middot; {timeAgo}</p>
              </div>
            </Link>
            {isOwner && (
              <div className="relative">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button onClick={onDelete} className="text-xs text-red-600 font-bold hover:underline">Delete</button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#999] hover:text-black">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="p-1 hover:bg-[#fafafa] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {post.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
          )}
        </div>

        {post.images.length > 0 && (
          <div className={`grid ${post.images.length === 1 ? "" : "grid-cols-2"} gap-0.5`}>
            {post.images.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightboxImg(url)}
                className={`w-full bg-[#f5f5f5] overflow-hidden ${
                  post.images.length === 1 ? "aspect-video" : post.images.length === 3 && i === 0 ? "row-span-2 aspect-square" : "aspect-square"
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </button>
            ))}
          </div>
        )}

        {post.project && (
          <Link
            href={`/projects/${post.project.id}`}
            className="block mx-5 mb-5 mt-3 border border-[#e5e5e5] hover:border-black transition-colors overflow-hidden"
          >
            {post.project.imageUrl && (
              <div className="w-full aspect-[3/1] bg-[#f5f5f5]">
                <img src={post.project.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <p className="font-bold text-sm mb-0.5">{post.project.title}</p>
              {post.project.subtitle && (
                <p className="text-xs text-[#666] line-clamp-1 mb-2">{post.project.subtitle}</p>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 border border-[#ccc]">{post.project.category}</span>
                {post.project.goalAmount && (
                  <span className="text-[#666]">{sym}{post.project.goalAmount.toLocaleString()} goal</span>
                )}
                <span className={`px-2 py-0.5 border ${post.project.status === "active" ? "border-black bg-black text-white" : "border-[#ccc]"}`}>
                  {post.project.status}
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white text-black flex items-center justify-center text-xl font-bold z-10"
          >
            &times;
          </button>
          <img src={lightboxImg} alt="" className="max-w-full max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
