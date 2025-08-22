import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { published, title, content } = await req.json()
    const postId = params.id

    // Check if post exists and belongs to user
    const existingPost = await db.post.findFirst({
      where: { 
        id: postId,
        authorId: session.user.id 
      }
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Update post
    const updatedPost = await db.post.update({
      where: { id: postId },
      data: {
        ...(published !== undefined && { published }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({ post: updatedPost })

  } catch (error) {
    console.error("Blog post PATCH error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id

    // Check if post exists and belongs to user
    const existingPost = await db.post.findFirst({
      where: { 
        id: postId,
        authorId: session.user.id 
      }
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Delete post
    await db.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Blog post DELETE error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}