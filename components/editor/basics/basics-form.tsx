"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect, useState, useCallback, useRef } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useUploadThing } from "@/lib/uploadthing"

const categories = [
  {
    id: "technology",
    label: "Technology",
    subs: ["Web Development", "Mobile Apps", "Hardware", "AI/ML", "Blockchain", "IoT"],
  },
  {
    id: "social",
    label: "Social Projects",
    subs: ["Charity", "Community", "Education", "Environment", "Health"],
  },
  {
    id: "art",
    label: "Art",
    subs: ["Film", "Music", "Photography", "Painting", "Digital Art", "Theater"],
  },
  {
    id: "food",
    label: "Food",
    subs: ["Restaurants", "Food Trucks", "Packaged Foods", "Beverages", "Farming"],
  },
  {
    id: "games",
    label: "Games",
    subs: ["Video Games", "Board Games", "Card Games", "Puzzles", "VR"],
  },
  {
    id: "publishing",
    label: "Publishing",
    subs: ["Fiction", "Non-Fiction", "Comics", "Poetry", "Magazines", "Zines"],
  },
  {
    id: "fashion",
    label: "Fashion",
    subs: ["Clothing", "Accessories", "Jewelry", "Footwear", "Sustainable Fashion"],
  },
]

const currencySymbols: Record<string, string> = {
  KZT: "₸",
  RUB: "₽",
  UAH: "₴",
  BYN: "Br",
  USD: "$",
}

const basicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(60),
  subtitle: z.string().max(135).optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  goalAmount: z.coerce.number().min(100, "Minimum goal is 100"),
  fundingType: z.enum(["AON", "KWYG"]),
  durationType: z.enum(["days", "date"]),
  durationDays: z.coerce.number().min(1).max(60).optional(),
  deadline: z.string().optional(),
})

type BasicsFormValues = {
  title: string
  subtitle?: string
  category: string
  subcategory?: string
  location?: string
  goalAmount: number
  fundingType: "AON" | "KWYG"
  durationType: "days" | "date"
  durationDays?: number
  deadline?: string
}

interface BasicsFormProps {
  projectId: string
  initialData: {
    title: string
    subtitle?: string | null
    category: string
    subcategory?: string | null
    location?: string | null
    country: string
    currency: string
    goalAmount?: number | null
    fundingType: string
    durationDays?: number | null
    deadline?: string | null
    imageUrl?: string | null
  }
  onSaveStatusChange: (status: "idle" | "saving" | "saved" | "error") => void
  onDirtyChange: (dirty: boolean) => void
  onProjectUpdate?: (data: Record<string, unknown>) => void
}

export function BasicsForm({ projectId, initialData, onSaveStatusChange, onDirtyChange, onProjectUpdate }: BasicsFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialData.category || "")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl || "")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const symbol = currencySymbols[initialData.currency] || initialData.currency

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BasicsFormValues>({
    resolver: zodResolver(basicsSchema) as never,
    defaultValues: {
      title: initialData.title || "",
      subtitle: initialData.subtitle || "",
      category: initialData.category || "",
      subcategory: initialData.subcategory || "",
      location: initialData.location || "",
      goalAmount: initialData.goalAmount || 0,
      fundingType: (initialData.fundingType as "AON" | "KWYG") || "AON",
      durationType: initialData.deadline ? "date" : "days",
      durationDays: initialData.durationDays || 30,
      deadline: initialData.deadline || "",
    },
  })

  const titleValue = watch("title")
  const subtitleValue = watch("subtitle")
  const categoryValue = watch("category")
  const durationType = watch("durationType")
  const fundingType = watch("fundingType")

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    setSelectedCategory(categoryValue)
  }, [categoryValue])

  const { startUpload } = useUploadThing("projectImage")

  const uploadFile = useCallback(async (file: File) => {
    setUploadError("")
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, WEBP files are accepted")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("File must be under 8MB")
      return
    }
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (!res || res.length === 0) {
        setUploadError("Upload failed")
        setUploading(false)
        return
      }
      const url = res[0].url
      const saveRes = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      })
      if (saveRes.ok) {
        setImageUrl(url)
        onProjectUpdate?.({ imageUrl: url })
      }
    } catch {
      setUploadError("Upload failed. Try again.")
    } finally {
      setUploading(false)
    }
  }, [projectId, onProjectUpdate, startUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const removeImage = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: "" }),
      })
      if (res.ok) {
        setImageUrl("")
        onProjectUpdate?.({ imageUrl: "" })
      }
    } catch {
      /* */
    }
  }, [projectId, onProjectUpdate])

  const onSubmit = useCallback(async (data: BasicsFormValues) => {
    onSaveStatusChange("saving")
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          subtitle: data.subtitle,
          category: data.category,
          subcategory: data.subcategory,
          location: data.location,
          goalAmount: data.goalAmount,
          fundingType: data.fundingType,
          durationDays: data.durationType === "days" ? data.durationDays : null,
          deadline: data.durationType === "date" ? data.deadline : null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        onProjectUpdate?.(result.project)
        onSaveStatusChange("saved")
        setTimeout(() => onSaveStatusChange("idle"), 2000)
      } else {
        onSaveStatusChange("error")
      }
    } catch {
      onSaveStatusChange("error")
    }
  }, [projectId, onSaveStatusChange, onProjectUpdate])

  const subcategories = categories.find((c) => c.id === selectedCategory)?.subs || []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Start with the basics</h2>
          <p className="text-sm text-[#666]">
            Make it easy for people to learn about your project.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Project title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="The name of your project"
            className="h-12"
            maxLength={60}
          />
          <div className="flex justify-between text-xs text-[#999]">
            {errors.title ? (
              <span className="text-black">{errors.title.message}</span>
            ) : (
              <span>Write a clear, brief title that helps people quickly understand your project.</span>
            )}
            <span>{titleValue?.length || 0}/60</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Short description</Label>
          <Textarea
            id="subtitle"
            {...register("subtitle")}
            placeholder="A brief summary of your project"
            className="min-h-[80px] resize-none"
            maxLength={135}
          />
          <div className="flex justify-between text-xs text-[#999]">
            <span>Describe your project in one or two sentences.</span>
            <span>{subtitleValue?.length || 0}/135</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Project image</h2>
          <p className="text-sm text-[#666]">
            This is the first thing backers see. Use a high-quality, landscape image.
          </p>
        </div>

        {imageUrl ? (
          <div className="space-y-3">
            <div className="relative w-full border-2 border-black overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <Image src={imageUrl} alt="Project image" fill className="object-cover" unoptimized />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#999]">Displayed at 16:9 ratio across the platform</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Replace
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={removeImage}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed p-12 cursor-pointer transition-colors text-center ${
              dragOver ? "border-black bg-[#f5f5f5]" : "border-[#ccc] hover:border-black hover:bg-[#fafafa]"
            }`}
            style={{ aspectRatio: "16/9" }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-3">
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold">Uploading...</p>
                </>
              ) : (
                <>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  <p className="text-sm font-bold">Drop image here or click to browse</p>
                  <p className="text-xs text-[#999]">JPG, PNG, WEBP &middot; Max 8MB &middot; Recommended 1200&times;675px (16:9)</p>
                </>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
            e.target.value = ""
          }}
        />

        {uploadError && (
          <div className="p-3 border-2 border-black bg-[#fafafa]">
            <p className="text-xs">{uploadError}</p>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Project category</h2>
          <p className="text-sm text-[#666]">
            Choose a primary category and subcategory to help backers find your project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryValue}
              onValueChange={(v) => setValue("category", v, { shouldDirty: true })}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent position="popper">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-black">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subcategory</Label>
            <Select
              value={watch("subcategory") || ""}
              onValueChange={(v) => setValue("subcategory", v, { shouldDirty: true })}
              disabled={!selectedCategory}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent position="popper">
                {subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {categoryValue === "social" && (
          <div className="p-4 border-2 border-black bg-[#fafafa]">
            <p className="text-sm font-bold mb-1">Verification required</p>
            <p className="text-xs text-[#666]">
              Social projects require verification of charity status in Kazakhstan/CIS before launch.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Project location</h2>
          <p className="text-sm text-[#666]">
            Enter the location that best describes where your project is based.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">City or region</Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="e.g. Almaty, Kazakhstan"
            className="h-12"
          />
          <p className="text-xs text-[#999]">
            This won't restrict who can back your project.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Funding goal</h2>
          <p className="text-sm text-[#666]">
            Set an achievable goal that covers what you need to complete your project.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goalAmount">Goal amount ({symbol})</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#999]">
              {symbol}
            </span>
            <Input
              id="goalAmount"
              type="number"
              {...register("goalAmount")}
              className="h-12 pl-10"
              min={100}
            />
          </div>
          {errors.goalAmount && (
            <p className="text-xs text-black">{errors.goalAmount.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <Label>Funding model</Label>
          <RadioGroup
            value={fundingType}
            onValueChange={(val) => setValue("fundingType", val as "AON" | "KWYG", { shouldDirty: true })}
          >
            <label className="flex items-start gap-4 p-4 border-2 border-black cursor-pointer hover:bg-[#fafafa] transition-colors">
              <RadioGroupItem value="AON" id="aon" className="mt-1" />
              <div>
                <p className="font-bold">All-or-Nothing</p>
                <p className="text-xs text-[#666]">
                  You only get funds if you reach the goal. Backers are only charged if successful.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-4 border-2 border-black cursor-pointer hover:bg-[#fafafa] transition-colors">
              <RadioGroupItem value="KWYG" id="kwyg" className="mt-1" />
              <div>
                <p className="font-bold">Keep-What-You-Get</p>
                <p className="text-xs text-[#666]">
                  You keep all funds raised, even if the goal isn't met. Higher platform commission applies.
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Campaign duration</h2>
          <p className="text-sm text-[#666]">
            Set a time limit for your campaign. Shorter campaigns tend to perform better.
          </p>
        </div>

        <RadioGroup
          value={durationType}
          onValueChange={(val) => setValue("durationType", val as "days" | "date", { shouldDirty: true })}
        >
          <label className="flex items-start gap-4 p-4 border-2 border-black cursor-pointer hover:bg-[#fafafa] transition-colors">
            <RadioGroupItem value="days" id="duration-days" className="mt-1" />
            <div className="flex-1">
              <p className="font-bold">Fixed number of days</p>
              <p className="text-xs text-[#666] mb-3">1–60 days from launch.</p>
              {durationType === "days" && (
                <Input
                  type="number"
                  {...register("durationDays")}
                  min={1}
                  max={60}
                  className="w-24 h-10"
                />
              )}
            </div>
          </label>
          <label className="flex items-start gap-4 p-4 border-2 border-black cursor-pointer hover:bg-[#fafafa] transition-colors">
            <RadioGroupItem value="date" id="duration-date" className="mt-1" />
            <div className="flex-1">
              <p className="font-bold">End on a specific date & time</p>
              <p className="text-xs text-[#666] mb-3">Choose when your campaign ends.</p>
              {durationType === "date" && (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-auto h-10 justify-start text-left font-normal">
                      {watch("deadline")
                        ? new Date(watch("deadline") || "").toLocaleDateString()
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch("deadline") ? new Date(watch("deadline") || "") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setValue("deadline", date.toISOString(), { shouldDirty: true })
                          setCalendarOpen(false)
                        }
                      }}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </label>
        </RadioGroup>
      </section>

      <div className="sticky bottom-0 bg-white border-t-2 border-black py-4 -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  )
}
