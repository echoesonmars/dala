"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentPageProps {
  projectId: string
  country: string
  entityType?: string | null
  onEntityTypeChange?: (type: string | null) => void
}

const banksByCountry: Record<string, string[]> = {
  KZ: ["Kaspi Bank", "Halyk Bank", "Jusan Bank", "Forte Bank", "Bereke Bank"],
  RU: ["Sberbank", "Tinkoff", "VTB", "Alfa-Bank", "Raiffeisen"],
  UA: ["PrivatBank", "Monobank", "PUMB", "OschadBank"],
  BY: ["Belarusbank", "BelAPB", "Priorbank", "BPS-Sberbank"],
}

interface LockedSectionProps {
  title: string
  description: string
}

function LockedSection({ title, description }: LockedSectionProps) {
  return (
    <div className="border-2 border-[#ccc] p-6 opacity-50">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg">🔒</span>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <p className="text-sm text-[#666]">{description}</p>
    </div>
  )
}

export function PaymentPage({ projectId, country, entityType: initialEntityType, onEntityTypeChange }: PaymentPageProps) {
  const { data: session } = useSession()
  const [step, setStep] = useState(initialEntityType ? 2 : 0)
  const [entityType, setEntityType] = useState(initialEntityType || "")
  const [iban, setIban] = useState("")
  const [bank, setBank] = useState("")
  const [holderName, setHolderName] = useState("")
  const [saving, setSaving] = useState(false)

  const banks = banksByCountry[country] || []
  const emailVerified = !!session?.user?.email

  const handleVerifyEmail = async () => {
    setStep(1)
  }

  const handleSaveEntityType = async () => {
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType }),
    })
    if (res.ok) {
      setStep(2)
      onEntityTypeChange?.(entityType)
    }
    setSaving(false)
  }

  const handleSavePayout = async () => {
    setSaving(true)
    await fetch(`/api/projects/${projectId}/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iban, bank, holderName }),
    })
    setSaving(false)
    setStep(3)
  }

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-1">Payment & Verification</h2>
        <p className="text-sm text-[#666]">
          Verify your identity and set up payouts to receive funds.
        </p>
      </div>

      <section className="space-y-6">
        <div className="border-2 border-black p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">1. Contact email</h3>
              <p className="text-sm text-[#666]">Confirm your email address.</p>
            </div>
            {emailVerified && step >= 1 && (
              <span className="text-xs px-3 py-1 border-2 border-black bg-black text-white font-bold">
                Verified
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Input value={session?.user?.email || ""} disabled className="flex-1" />
            {step < 1 && (
              <Button onClick={handleVerifyEmail}>
                Verify email
              </Button>
            )}
          </div>
        </div>

        {step >= 1 ? (
          <div className="border-2 border-black p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">2. Project type</h3>
                <p className="text-sm text-[#666]">How are you raising funds?</p>
              </div>
              {step >= 2 && entityType && (
                <span className="text-xs px-3 py-1 border-2 border-black bg-black text-white font-bold">
                  {entityType}
                </span>
              )}
            </div>

            {step < 2 && (
              <>
                <RadioGroup value={entityType} onValueChange={setEntityType}>
                  <label className="flex items-start gap-4 p-4 border-2 border-black cursor-pointer hover:bg-[#fafafa] transition-colors">
                    <RadioGroupItem value="INDIVIDUAL" className="mt-1" />
                    <div>
                      <p className="font-bold">Individual</p>
                      <p className="text-xs text-[#666]">I am raising funds for myself.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 border-2 border-black cursor-pointer hover:bg-[#fafafa] transition-colors">
                    <RadioGroupItem value="BUSINESS" className="mt-1" />
                    <div>
                      <p className="font-bold">Legal Entity (TOO/IP/LLC)</p>
                      <p className="text-xs text-[#666]">I am raising funds for a registered business.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 border-2 border-black cursor-pointer hover:bg-[#fafafa] transition-colors">
                    <RadioGroupItem value="NONPROFIT" className="mt-1" />
                    <div>
                      <p className="font-bold">Non-Profit</p>
                      <p className="text-xs text-[#666]">I am raising funds for a charity or NGO.</p>
                    </div>
                  </label>
                </RadioGroup>
                <Button onClick={handleSaveEntityType} disabled={!entityType || saving}>
                  {saving ? "Saving..." : "Continue"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <LockedSection title="Project type" description="Complete email verification to unlock this section." />
        )}

        {step >= 2 ? (
          <div className="border-2 border-black p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">3. Payout method</h3>
                <p className="text-sm text-[#666]">Where should we send your funds?</p>
              </div>
              {step >= 3 && (
                <span className="text-xs px-3 py-1 border-2 border-black bg-black text-white font-bold">
                  Connected
                </span>
              )}
            </div>

            {step < 3 && (
              <>
                <div className="p-4 border-2 border-black bg-[#fafafa]">
                  <p className="text-xs text-[#666]">
                    Dala complies with AML laws. Your banking data is encrypted and never shared with third parties.
                  </p>
                </div>

                  <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bank</Label>
                    <Select value={bank} onValueChange={setBank}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {banks.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                      placeholder={country === "KZ" ? "KZ00 0000 0000 0000 0000" : "Enter IBAN"}
                    />
                    <p className="text-xs text-[#999]">
                      {country === "KZ" && "Kazakhstan IBANs start with KZ and contain 20 characters."}
                      {country === "RU" && "Enter your 20-digit bank account number."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Account holder name</Label>
                    <Input
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Must match your verified identity"
                    />
                  </div>
                </div>

                <Button onClick={handleSavePayout} disabled={!bank || !iban || !holderName || saving}>
                  {saving ? "Saving..." : "Connect payout method"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <LockedSection title="Payout method" description="Complete the previous steps to unlock payouts." />
        )}

        {step >= 3 ? (
          <div className="border-2 border-black p-6 text-center py-12">
            <p className="text-2xl font-bold mb-2">You're all set</p>
            <p className="text-sm text-[#666]">
              Your payment setup is complete. You can now launch your project.
            </p>
          </div>
        ) : (
          <LockedSection title="Ready to launch" description="Complete all verification steps to launch your project." />
        )}
      </section>
    </div>
  )
}
