import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const rewards = await prisma.rewardTier.findMany({ where: { projectId: id }, orderBy: { amount: "asc" } })
    return NextResponse.json({ rewards })
  } catch (error) {
    console.error("Rewards fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { title, description, amount, shippingType, quantityLimit, itemIds } = await req.json()
    if (!title || amount < 0) return NextResponse.json({ error: "Title is required and amount cannot be negative" }, { status: 400 })

    const reward = await prisma.rewardTier.create({
      data: {
        title,
        description,
        amount,
        shippingType: shippingType || "DIGITAL",
        quantityLimit: quantityLimit || null,
        itemIds: itemIds || [],
        projectId: id,
      },
    })

    return NextResponse.json({ reward }, { status: 201 })
  } catch (error) {
    console.error("Reward create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
