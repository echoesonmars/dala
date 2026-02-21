import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")
    const limit = 20

    const follows = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })
    const followingIds = follows.map((f) => f.followingId)

    const backedProjectIds = (
      await prisma.pledge.findMany({
        where: { userId: session.user.id },
        select: { projectId: true },
        distinct: ["projectId"],
      })
    ).map((p) => p.projectId)

    const orConditions: Record<string, unknown>[] = []

    if (followingIds.length > 0) {
      orConditions.push({ authorId: { in: followingIds } })
    }

    if (backedProjectIds.length > 0) {
      orConditions.push({ projectId: { in: backedProjectIds } })
    }

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    orConditions.push({ createdAt: { gte: weekAgo } })

    const posts = await prisma.post.findMany({
      where: orConditions.length > 0 ? { OR: orConditions } : {},
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
        project: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            category: true,
            imageUrl: true,
            currency: true,
            goalAmount: true,
            status: true,
            vanitySlug: true,
          },
        },
      },
    })

    const hasMore = posts.length > limit
    const results = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? results[results.length - 1].id : null

    const trendingProjects = await prisma.project.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        subtitle: true,
        category: true,
        imageUrl: true,
        currency: true,
        goalAmount: true,
        vanitySlug: true,
        user: { select: { name: true, username: true } },
        _count: { select: { pledges: true } },
      },
    })

    return NextResponse.json({ posts: results, nextCursor, trendingProjects })
  } catch (error) {
    console.error("Feed error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
