"use client"

import { Navigation, Footer, BrowseCard } from "../components"
import { featuredProjects } from "../data/projects"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Project } from "../types"

const categories = [
  "All",
  "Technology",
  "Art",
  "Food",
  "Games",
  "Publishing",
  "Fashion",
  "Social",
]

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending soon" },
  { value: "most_funded", label: "Most funded" },
]

export default function BrowsePage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [projects, setProjects] = useState<Project[]>(featuredProjects)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("newest")
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchProjects = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("category", selectedCategory)
    params.set("sort", sort)
    if (query.trim()) params.set("q", query.trim())

    fetch(`/api/projects/browse?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.projects && d.projects.length > 0) {
          setProjects(d.projects)
        } else if (selectedCategory === "All" && !query.trim()) {
          setProjects(featuredProjects)
        } else {
          setProjects([])
        }
        setLoading(false)
      })
      .catch(() => {
        setProjects(featuredProjects)
        setLoading(false)
      })
  }, [selectedCategory, sort, query])

  useEffect(() => {
    const timeout = setTimeout(fetchProjects, query ? 350 : 0)
    return () => clearTimeout(timeout)
  }, [fetchProjects, query])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main>
        <div className="border-b-2 border-black bg-[#fafafa]">
          <div className="px-4 md:px-6 max-w-[1200px] mx-auto py-10 md:py-14">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              Explore projects
            </h1>

            <div className="flex items-center border-2 border-black bg-white h-12 max-w-2xl">
              <svg className="w-5 h-5 ml-4 shrink-0 text-[#999]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects by name, description..."
                className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none placeholder:text-[#999]"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="px-3 text-[#999] hover:text-black transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-[#bbb] mr-3 shrink-0 border border-[#ddd] px-1.5 py-0.5">
                  /
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-b-2 border-black sticky top-0 bg-white z-30">
          <div className="px-4 md:px-6 max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all border-2 ${
                      selectedCategory === category
                        ? "bg-black text-white border-black"
                        : "bg-white text-[#666] border-[#e5e5e5] hover:border-black hover:text-black"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[#999] hidden sm:block">
                  {loading ? "..." : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
                </span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end">
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 max-w-[1200px] mx-auto py-8 md:py-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">∅</div>
              <h2 className="text-xl font-bold mb-2">No projects found</h2>
              <p className="text-[#888] text-sm mb-6">
                {query
                  ? `Nothing matched "${query}"`
                  : "Try a different category"}
              </p>
              {(query || selectedCategory !== "All") && (
                <button
                  onClick={() => { setQuery(""); setSelectedCategory("All") }}
                  className="text-sm font-medium underline underline-offset-4 hover:no-underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <BrowseCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
