"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Navigation, Footer } from "@/app/components"

const ALL_INTERESTS = [
  "Technology", "Art", "Music", "Games", "Film", "Food",
  "Fashion", "Social Impact", "Science", "Design",
  "Photography", "Sports", "Education", "Health",
  "Travel", "Environment", "Publishing", "Crafts",
]

type Section = "profile" | "password" | "danger"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [section, setSection] = useState<Section>("profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [interests, setInterests] = useState<string[]>([])

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [dangerAction, setDangerAction] = useState<"deactivate" | "delete" | null>(null)
  const [dangerPassword, setDangerPassword] = useState("")
  const [dangerLoading, setDangerLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d.user) {
            setName(d.user.name || "")
            setUsername(d.user.username || "")
            setBio(d.user.bio || "")
            setInterests(d.user.interests || [])
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status, router])

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(""), 4000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio, interests }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.error || "Failed to save", "error")
      } else {
        showMessage("Profile updated", "success")
        await update()
      }
    } catch {
      showMessage("Something went wrong", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage("Passwords don't match", "error")
      return
    }
    if (newPassword.length < 8) {
      showMessage("New password must be at least 8 characters", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.error || "Failed to change password", "error")
      } else {
        showMessage("Password changed", "success")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      showMessage("Something went wrong", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDangerAction = async () => {
    if (!dangerAction || !dangerPassword) return
    setDangerLoading(true)
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: dangerPassword, action: dangerAction }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.error || "Action failed", "error")
        setDangerLoading(false)
        return
      }
      if (dangerAction === "delete") {
        await signOut({ redirect: false })
        router.push("/")
      } else {
        setDangerAction(null)
        setDangerPassword("")
        showMessage("Account deactivated", "success")
        await signOut({ redirect: false })
        router.push("/")
      }
    } catch {
      showMessage("Something went wrong", "error")
      setDangerLoading(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const userExt = session?.user as Record<string, unknown> | undefined
  const currentUsername = userExt?.username as string | undefined

  const sections: { key: Section; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "password", label: "Password" },
    { key: "danger", label: "Account" },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="border-b-2 border-black">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href={currentUsername ? `/u/${currentUsername}` : "/dashboard"}
              className="text-sm text-[#999] hover:text-black transition-colors"
            >
              &larr; Back to profile
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
        </div>
      </div>

      {message && (
        <div className={`border-b-2 ${messageType === "error" ? "border-red-600 bg-red-50" : "border-black bg-[#f0f9f0]"}`}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-3">
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
      )}

      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10">
          <nav className="flex md:flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`px-4 py-2.5 text-sm text-left transition-colors ${
                  section === s.key
                    ? "bg-black text-white font-bold"
                    : "hover:bg-[#fafafa] text-[#666]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0">
            {section === "profile" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-1">Edit profile</h2>
                  <p className="text-sm text-[#666]">This information is publicly visible on your profile.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-12 border-2 border-black max-w-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold">Username</label>
                    <div className="relative max-w-md">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] font-mono">@</span>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className="h-12 border-2 border-black pl-9 font-mono"
                        maxLength={20}
                      />
                    </div>
                    <p className="text-xs text-[#999]">dala.kz/u/{username || "yourname"}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself"
                      maxLength={200}
                      rows={3}
                      className="w-full max-w-md border-2 border-black px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <p className="text-xs text-[#999]">{bio.length}/200</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold">Interests</label>
                    <p className="text-xs text-[#666]">Select the categories you&apos;re passionate about. These appear on your public profile.</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_INTERESTS.map((interest) => {
                        const selected = interests.includes(interest)
                        return (
                          <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`px-3 py-1.5 text-sm border-2 transition-colors ${
                              selected
                                ? "border-black bg-black text-white"
                                : "border-[#e5e5e5] hover:border-black"
                            }`}
                          >
                            {interest}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto h-11">
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            )}

            {section === "password" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-1">Change password</h2>
                  <p className="text-sm text-[#666]">Update your password to keep your account secure.</p>
                </div>

                <div className="space-y-5 max-w-md">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold">Current password</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-12 border-2 border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold">New password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="h-12 border-2 border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold">Confirm new password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 border-2 border-black"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-600">Passwords don&apos;t match</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="h-11"
                >
                  {saving ? "Changing..." : "Change password"}
                </Button>
              </div>
            )}

            {section === "danger" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-1">Account</h2>
                  <p className="text-sm text-[#666]">Manage your account status. These actions may be irreversible.</p>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-[#e5e5e5] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold mb-1">Deactivate account</h3>
                        <p className="text-sm text-[#666]">
                          Your profile will be hidden and your name replaced. Your projects and pledges will remain
                          but won&apos;t be linked to your identity. You can reactivate by logging in again.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setDangerAction("deactivate")}
                        className="shrink-0"
                      >
                        Deactivate
                      </Button>
                    </div>
                  </div>

                  <div className="border-2 border-red-200 p-6 bg-red-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold mb-1 text-red-700">Delete account</h3>
                        <p className="text-sm text-[#666]">
                          Permanently delete your account, projects, pledges, and all associated data.
                          This action cannot be undone.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setDangerAction("delete")}
                        className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#e5e5e5] pt-6">
                  <h3 className="font-bold mb-2">Export data</h3>
                  <p className="text-sm text-[#666] mb-4">
                    Download a copy of your data including your profile, projects, and pledge history.
                  </p>
                  <Button variant="outline" disabled>
                    Coming soon
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!dangerAction} onOpenChange={(open) => { if (!open) { setDangerAction(null); setDangerPassword("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dangerAction === "delete" ? "Delete your account?" : "Deactivate your account?"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-[#666]">
              {dangerAction === "delete"
                ? "This will permanently delete your account and all associated data. This cannot be undone."
                : "Your profile will be hidden. You can reactivate by logging back in."}
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-bold">Confirm your password</label>
              <Input
                type="password"
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12 border-2 border-black"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setDangerAction(null); setDangerPassword("") }}>
                Cancel
              </Button>
              <Button
                className={`flex-1 ${dangerAction === "delete" ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={handleDangerAction}
                disabled={!dangerPassword || dangerLoading}
              >
                {dangerLoading
                  ? "Processing..."
                  : dangerAction === "delete"
                  ? "Delete permanently"
                  : "Deactivate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
