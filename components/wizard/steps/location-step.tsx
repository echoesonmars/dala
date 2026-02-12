"use client"

import { useWizardStore } from "@/lib/store/wizard-store"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const countries = [
  { id: "KZ", label: "Kazakhstan", currency: "KZT", payment: "Kaspi, Halyk, Jusan" },
  { id: "RU", label: "Russia", currency: "RUB", payment: "SBP, Mir Cards" },
  { id: "UA", label: "Ukraine", currency: "UAH", payment: "Privat24, Monobank" },
  { id: "BY", label: "Belarus", currency: "BYN", payment: "BelarusPay" },
]

export function LocationStep({ isLastStep = false }: { isLastStep?: boolean }) {
  const { country, setCountry, setCurrency, setCurrentStep } = useWizardStore()

  const selectedCountry = countries.find((c) => c.id === country)

  const handleCountryChange = (value: string) => {
    setCountry(value)
    const match = countries.find((c) => c.id === value)
    setCurrency(match?.currency ?? "")
  }

  const handleNext = () => {
    if (country) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Last one—set a location for your project.
        </h1>
        <p className="text-xl text-[#666] mb-2">
          Pick your country of legal residence if you're raising funds as an individual.
        </p>
        <p className="text-sm text-[#999]">
          If you're raising funds for a business or nonprofit, select the country where the entity's tax ID is registered.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-mono uppercase tracking-wider mb-3">
            Your country
          </label>
          <Select value={country} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full h-12 text-lg">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent position="popper">
              {countries.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCountry && (
          <div className="bg-[#fafafa] border-2 border-black p-6">
            <div className="text-sm font-mono uppercase tracking-wider mb-2">
              Payment details
            </div>
            <p className="text-[#666] mb-3">
              Currency: <span className="font-bold text-black">{selectedCountry.currency}</span>
            </p>
            <p className="text-[#666]">
              Compatible with: <span className="font-bold text-black">{selectedCountry.payment}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-8">
        <Button
          size="lg"
          variant="outline"
          onClick={handleBack}
          className="px-8"
        >
          ← Category
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!country}
          className="px-12"
        >
          {isLastStep ? "Create project" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
