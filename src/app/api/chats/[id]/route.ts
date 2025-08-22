import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const chatId = params.id

    // Check if chat exists and belongs to user
    const existingChat = await db.aIChat.findFirst({
      where: { 
        id: chatId,
        userId: session.user.id 
      }
    })

    if (!existingChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Delete chat
    await db.aIChat.delete({
      where: { id: chatId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Chat DELETE error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const chatId = params.id

    // Get specific chat
    const chat = await db.aIChat.findFirst({
      where: { 
        id: chatId,
        userId: session.user.id 
      }
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json({ chat })

  } catch (error) {
    console.error("Chat GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}