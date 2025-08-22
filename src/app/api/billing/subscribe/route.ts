import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan, amount } = await req.json()

    if (!plan || !amount) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Simulate subscription processing (in real app, integrate with Stripe)
    // For demo purposes, we'll just create a payment record and update subscription status
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: amount,
        currency: "USD",
        status: "completed",
        paymentMethod: "demo_subscription",
        transactionId: `sub_${Date.now()}`,
        creditsAdded: 0 // Subscription gives unlimited credits
      }
    })

    // Update user subscription status
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isSubscribed: true
      }
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      isSubscribed: updatedUser.isSubscribed
    })

  } catch (error) {
    console.error("Subscription API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}