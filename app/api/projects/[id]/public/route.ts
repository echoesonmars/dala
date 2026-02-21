import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let project = null
    const isObjectId = /^[a-f\d]{24}$/i.test(id)
    if (isObjectId) {
      project = await prisma.project.findFirst({
        where: { id },
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
          rewardTiers: { orderBy: { amount: "asc" } },
        },
      })
    }
    if (!project) {
      project = await prisma.project.findFirst({
        where: { vanitySlug: id },
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
          rewardTiers: { orderBy: { amount: "asc" } },
        },
      })
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const pledgeStats = await prisma.pledge.aggregate({
      where: { projectId: project.id },
      _sum: { amount: true },
      _count: true,
    })

    const creatorProjectCount = await prisma.project.count({
      where: { userId: project.userId },
    })

    return NextResponse.json({
      project: {
        ...project,
        totalRaised: pledgeStats._sum.amount || 0,
        backerCount: pledgeStats._count,
        creatorProjectCount,
      },
    })
  } catch (error) {
    console.error("Public project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
