"use client"

import Image from "next/image"
import Link from "next/link"
import type { Project } from "../types"

interface BrowseCardProps {
  project: Project
}

export function BrowseCard({ project }: BrowseCardProps) {
  const progress = Math.min(100, Math.round((project.funded / project.goal) * 100))

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
        <div className="relative w-full aspect-4/3 bg-[#f5f5f5] overflow-hidden">
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 bg-white px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-black/10">
            {project.category}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-base leading-tight mb-1 line-clamp-2 group-hover:underline">
            {project.title}
          </h3>
          <p className="text-xs text-[#888] mb-3">by {project.creator}</p>
          <p className="text-sm text-[#666] leading-relaxed mb-4 line-clamp-2">
            {project.description}
          </p>

          <div className="h-1.5 bg-[#eee] w-full mb-3">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">
              ${project.funded >= 1000 ? `${(project.funded / 1000).toFixed(0)}K` : project.funded}
            </span>
            <span className="text-[#888]">
              {progress}% of ${project.goal >= 1000 ? `${(project.goal / 1000).toFixed(0)}K` : project.goal}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#eee] text-[11px] text-[#888]">
            <span>{project.backers.toLocaleString()} backers</span>
            <span className="w-0.5 h-0.5 rounded-full bg-[#ccc]" />
            <span>{project.daysLeft} days left</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
