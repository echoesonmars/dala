"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { safeJsonParse } from "@/lib/utils"

interface Reward {
  id: string
  title: string
  amount: number
}

interface PledgeSidebarProps {
  projectId: string
  currency: string
  rewards: Reward[]
  status: string
  creatorId: string
  mobile?: boolean
}

export function PledgeSidebar({ projectId, currency, rewards, status, creatorId, mobile }: PledgeSidebarProps) {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"reward" | "amount" | "auth" | "confirm">("reward")
  const [selectedReward, setSelectedReward] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" })
  const [isSignup, setIsSignup] = useState(true)

  const isOwner = session?.user?.id === creatorId

  const handleSelectReward = (rewardId: string | null, rewardAmount: number) => {
    setSelectedReward(rewardId)
    setAmount(rewardAmount)
    setStep("amount")
  }

  const handleContinue = () => {
    if (authStatus === "authenticated") {
      setStep("confirm")
    } else {
      setStep("auth")
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authForm),
        })
        if (!res.ok) {
          const data = await safeJsonParse<{ error?: string }>(res)
          setError(data?.error || "Signup failed")
          setLoading(false)
          return
        }
      }

      const result = await signIn("credentials", {
        email: authForm.email,
        password: authForm.password,
        redirect: false,
      })

      if (result?.error) {
        setError(isSignup ? "Account created but login failed" : "Invalid credentials")
        setLoading(false)
        return
      }

      setStep("confirm")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handlePledge = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/projects/${projectId}/pledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, rewardId: selectedReward }),
      })

      if (!res.ok) {
        const data = await safeJsonParse<{ error?: string }>(res)
        setError(data?.error || "Pledge failed")
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  const handleOpen = (val: boolean) => {
    setOpen(val)
    if (!val) {
      setStep("reward")
      setSelectedReward(null)
      setAmount(0)
      setError("")
      if (success) {
        router.refresh()
        setSuccess(false)
      }
    }
  }

  if (mobile) {
    return (
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full" disabled={isOwner}>
            {isOwner ? "This is your project" : "Back this project"}
          </Button>
        </DialogTrigger>
        <PledgeDialogContent
          step={step}
          rewards={rewards}
          currency={currency}
          amount={amount}
          setAmount={setAmount}
          selectedReward={selectedReward}
          onSelectReward={handleSelectReward}
          onContinue={handleContinue}
          onPledge={handlePledge}
          onAuth={handleAuth}
          authForm={authForm}
          setAuthForm={setAuthForm}
          isSignup={isSignup}
          setIsSignup={setIsSignup}
          loading={loading}
          error={error}
          success={success}
          onBack={() => setStep(step === "confirm" || step === "auth" ? "amount" : "reward")}
        />
      </Dialog>
    )
  }

  return (
    <div className="sticky top-20">
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <div className="space-y-4">
            <Button size="lg" className="w-full text-lg h-14" disabled={isOwner}>
              {isOwner ? "This is your project" : "Back this project"}
            </Button>
            {!isOwner && (
              <p className="text-xs text-center text-[#999]">
                Pledge any amount to support this project
              </p>
            )}
          </div>
        </DialogTrigger>
        <PledgeDialogContent
          step={step}
          rewards={rewards}
          currency={currency}
          amount={amount}
          setAmount={setAmount}
          selectedReward={selectedReward}
          onSelectReward={handleSelectReward}
          onContinue={handleContinue}
          onPledge={handlePledge}
          onAuth={handleAuth}
          authForm={authForm}
          setAuthForm={setAuthForm}
          isSignup={isSignup}
          setIsSignup={setIsSignup}
          loading={loading}
          error={error}
          success={success}
          onBack={() => setStep(step === "confirm" || step === "auth" ? "amount" : "reward")}
        />
      </Dialog>
    </div>
  )
}

interface PledgeDialogContentProps {
  step: "reward" | "amount" | "auth" | "confirm"
  rewards: { id: string; title: string; amount: number }[]
  currency: string
  amount: number
  setAmount: (n: number) => void
  selectedReward: string | null
  onSelectReward: (id: string | null, amount: number) => void
  onContinue: () => void
  onPledge: () => void
  onAuth: (e: React.FormEvent) => void
  authForm: { name: string; email: string; password: string }
  setAuthForm: (f: { name: string; email: string; password: string }) => void
  isSignup: boolean
  setIsSignup: (v: boolean) => void
  loading: boolean
  error: string
  success: boolean
  onBack: () => void
}

function PledgeDialogContent({
  step, rewards, currency, amount, setAmount, selectedReward,
  onSelectReward, onContinue, onPledge, onAuth, authForm, setAuthForm,
  isSignup, setIsSignup, loading, error, success, onBack,
}: PledgeDialogContentProps) {
  if (success) {
    return (
      <DialogContent>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">&#10003;</div>
          <h2 className="text-2xl font-bold mb-2">You're a backer</h2>
          <p className="text-[#666]">
            Your {currency}{amount.toLocaleString()} pledge has been recorded. The creator will be notified.
          </p>
        </div>
      </DialogContent>
    )
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {step === "reward" && "Select your reward"}
          {step === "amount" && "Set your pledge"}
          {step === "auth" && (isSignup ? "Create account to pledge" : "Log in to pledge")}
          {step === "confirm" && "Confirm your pledge"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
        {step === "reward" && (
          <>
            <button
              onClick={() => onSelectReward(null, 0)}
              className="w-full text-left p-4 border-2 border-black hover:bg-[#fafafa] transition-colors"
            >
              <p className="font-bold">No reward</p>
              <p className="text-xs text-[#666]">I just want to support this project</p>
            </button>
            {rewards.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectReward(r.id, r.amount)}
                className="w-full text-left p-4 border-2 border-black hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-bold">{r.title}</p>
                  <p className="text-sm font-bold">{r.amount > 0 ? `${currency}${r.amount}` : "Free"}</p>
                </div>
                <p className="text-xs text-[#666]">{r.amount > 0 ? `Pledge ${currency}${r.amount} or more` : "Free reward"}</p>
              </button>
            ))}
          </>
        )}

        {step === "amount" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-bold block">Pledge amount ({currency})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#999]">{currency}</span>
                <Input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-10 h-14 text-2xl font-bold"
                  min={0}
                />
              </div>
              {selectedReward && (
                <p className="text-xs text-[#666]">
                  {(rewards.find((r) => r.id === selectedReward)?.amount || 0) > 0
                    ? `Minimum ${currency}${rewards.find((r) => r.id === selectedReward)?.amount} for this reward`
                    : "This is a free reward — pledge any amount you like, or nothing at all"}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
              <Button onClick={onContinue} disabled={amount < 0} className="flex-1">Continue</Button>
            </div>
          </>
        )}

        {step === "auth" && (
          <form onSubmit={onAuth} className="space-y-4">
            {isSignup && (
              <Input
                placeholder="Full name"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                required={isSignup}
                className="h-12"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              required
              className="h-12"
            />
            <Input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
              minLength={8}
              className="h-12"
            />
            {error && (
              <div className="p-3 border-2 border-black bg-neutral-100">
                <p className="text-xs">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? "Please wait..." : (isSignup ? "Create account & pledge" : "Log in & pledge")}
            </Button>
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="w-full text-center text-xs hover:opacity-60 transition-opacity"
            >
              {isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
            </button>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={onBack} className="flex-1">Back</Button>
            </div>
          </form>
        )}

        {step === "confirm" && (
          <>
            <div className="border-2 border-black p-6 text-center">
              <div className="text-4xl font-bold mb-1">{currency}{amount.toLocaleString()}</div>
              <p className="text-sm text-[#666]">
                {selectedReward
                  ? `Reward: ${rewards.find((r) => r.id === selectedReward)?.title}`
                  : "No reward selected"}
              </p>
            </div>
            {error && (
              <div className="p-3 border-2 border-black bg-neutral-100">
                <p className="text-xs">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
              <Button onClick={onPledge} disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Confirm pledge"}
              </Button>
            </div>
            <p className="text-xs text-center text-[#999]">
              No money is charged yet. You'll be charged when the project is successfully funded.
            </p>
          </>
        )}
      </div>
    </DialogContent>
  )
}
