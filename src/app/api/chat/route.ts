import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getModelById } from "@/lib/ai-models"
import ZAI from "z-ai-web-dev-sdk"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, chatId, model } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the selected model or use default
    const selectedModel = model ? getModelById(model) : getModelById("gpt-3.5-turbo")
    if (!selectedModel) {
      return NextResponse.json({ error: "Invalid model selected" }, { status: 400 })
    }

    // Check if user has enough credits or is subscribed
    const requiredCredits = selectedModel.creditsPerMessage
    if (user.credits < requiredCredits && !user.isSubscribed) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        requiredCredits,
        currentCredits: user.credits 
      }, { status: 403 })
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create or update chat
    let chat
    if (chatId) {
      chat = await db.aIChat.findUnique({
        where: { id: chatId, userId: user.id }
      })
      
      if (chat) {
        // Update existing chat
        const existingMessages = Array.isArray(chat.messages) ? chat.messages : []
        const updatedMessages = [
          ...existingMessages,
          { role: "user", content: message, timestamp: new Date().toISOString() }
        ]
        
        chat = await db.aIChat.update({
          where: { id: chatId },
          data: {
            messages: updatedMessages
          }
        })
      }
    }

    if (!chat) {
      // Create new chat
      chat = await db.aIChat.create({
        data: {
          userId: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          model: selectedModel.id,
          messages: [
            { role: "user", content: message, timestamp: new Date().toISOString() }
          ]
        }
      })
    }

    // Get AI response with model-specific settings
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant. Be concise, helpful, and friendly. You are ${selectedModel.name}, known for ${selectedModel.description.toLowerCase()}.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: selectedModel.maxTokens
    })

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    // Update chat with AI response and model
    const updatedMessages = [
      ...(Array.isArray(chat.messages) ? chat.messages : []),
      { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() }
    ]

    await db.aIChat.update({
      where: { id: chat.id },
      data: {
        messages: updatedMessages,
        model: selectedModel.id
      }
    })

    // Deduct credits if not subscribed
    let remainingCredits = user.credits
    if (!user.isSubscribed) {
      remainingCredits = user.credits - requiredCredits
      await db.user.update({
        where: { id: user.id },
        data: {
          credits: remainingCredits,
          preferredModel: selectedModel.id
        }
      })
    } else {
      // Update preferred model even for subscribed users
      await db.user.update({
        where: { id: user.id },
        data: {
          preferredModel: selectedModel.id
        }
      })
    }

    return NextResponse.json({
      response: aiResponse,
      chatId: chat.id,
      remainingCredits,
      model: selectedModel.id,
      modelName: selectedModel.name,
      creditsUsed: requiredCredits
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}