"use client"

import { useWizardStore } from "@/lib/store/wizard-store"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categories = [
  { id: "technology", label: "Technology" },
  { id: "design", label: "Design" },
  { id: "film", label: "Film & Video" },
  { id: "music", label: "Music" },
  { id: "art", label: "Art" },
  { id: "games", label: "Games" },
  { id: "fashion", label: "Fashion" },
  { id: "food", label: "Food & Craft" },
  { id: "publishing", label: "Publishing" },
]

const subcategories: Record<string, { id: string; label: string }[]> = {
  technology: [
    { id: "hardware", label: "Hardware" },
    { id: "software", label: "Software" },
    { id: "apps", label: "Apps" },
  ],
  design: [
    { id: "product", label: "Product Design" },
    { id: "graphic", label: "Graphic Design" },
    { id: "furniture", label: "Furniture" },
  ],
  film: [
    { id: "documentary", label: "Documentary" },
    { id: "short", label: "Short Film" },
    { id: "feature", label: "Feature Film" },
  ],
  music: [
    { id: "album", label: "Album" },
    { id: "tour", label: "Tour" },
    { id: "video", label: "Music Video" },
  ],
  art: [
    { id: "photography", label: "Photography" },
    { id: "sculpture", label: "Sculpture" },
    { id: "painting", label: "Painting" },
  ],
  games: [
    { id: "video", label: "Video Games" },
    { id: "tabletop", label: "Tabletop Games" },
    { id: "mobile", label: "Mobile Games" },
  ],
  fashion: [
    { id: "clothing", label: "Clothing" },
    { id: "accessories", label: "Accessories" },
    { id: "jewelry", label: "Jewelry" },
  ],
  food: [
    { id: "restaurant", label: "Restaurant" },
    { id: "product", label: "Food Product" },
    { id: "cookbook", label: "Cookbook" },
  ],
  publishing: [
    { id: "fiction", label: "Fiction" },
    { id: "nonfiction", label: "Nonfiction" },
    { id: "comics", label: "Comics" },
  ],
}

export function CategoryStep() {
  const { category, subcategory, setCategory, setSubcategory, setCurrentStep } = useWizardStore()

  const handleNext = () => {
    if (category && subcategory) {
      setCurrentStep(2)
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          First, let's get you set up.
        </h1>
        <p className="text-xl text-[#666] mb-2">
          Select a primary category and subcategory for your new project.
        </p>
        <p className="text-sm text-[#999]">
          These will help backers find your project, and you can change them later if you need to.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-mono uppercase tracking-wider mb-3">
            Category
          </label>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v)
              setSubcategory("")
            }}
          >
            <SelectTrigger className="w-full h-12 text-lg">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent position="popper">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {category && (
          <div>
            <label className="block text-sm font-mono uppercase tracking-wider mb-3">
              Subcategory
            </label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger className="w-full h-12 text-lg">
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent position="popper">
                {subcategories[category]?.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-8">
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!category || !subcategory}
          className="px-12"
        >
          Next: Location
        </Button>
      </div>
    </div>
  )
}
