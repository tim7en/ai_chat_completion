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

    const { planId, amount, credits } = await req.json()

    if (!planId || !amount || !credits) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Simulate payment processing (in real app, integrate with Stripe/PayPal)
    // For demo purposes, we'll just create a payment record and add credits
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: amount,
        currency: "USD",
        status: "completed",
        paymentMethod: "demo",
        transactionId: `demo_${Date.now()}`,
        creditsAdded: credits
      }
    })

    // Update user credits
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        credits: user.credits + credits
      }
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      newCredits: updatedUser.credits,
      creditsAdded: credits
    })

  } catch (error) {
    console.error("Purchase API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}