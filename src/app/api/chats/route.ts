import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's chat history
    const chats = await db.aIChat.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 50, // Limit to 50 most recent chats
    })

    return NextResponse.json({ chats })

  } catch (error) {
    console.error("Chats GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}