import { NextRequest } from 'next/server'
import { POST as ChatPOST } from '@/app/api/chat/route'
import { POST as PurchasePOST } from '@/app/api/billing/purchase/route'
import { POST as SubscribePOST } from '@/app/api/billing/subscribe/route'
import { mockPrismaClient, mockZAI } from '../utils/test-mocks'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: mockPrismaClient
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

jest.mock('@/lib/ai-models', () => ({
  getModelById: jest.fn((id) => {
    const models = {
      'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient',
        creditsPerMessage: 1,
        maxTokens: 4096,
        category: 'basic'
      },
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4', 
        description: 'More powerful',
        creditsPerMessage: 3,
        maxTokens: 8192,
        category: 'advanced'
      }
    }
    return models[id]
  })
}))

jest.mock('z-ai-web-dev-sdk', () => ({
  __esModule: true,
  default: {
    create: mockZAI.create
  }
}))

const { getServerSession } = require('next-auth')

describe('Full User Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete User Journey: Creation -> Purchase -> Chat Usage', () => {
    it('should handle complete user lifecycle with credit system', async () => {
      // 1. SIMULATE NEW USER CREATION
      const newUser = {
        id: "integration-test-user",
        email: "integration@test.com",
        name: "Integration Test User",
        credits: 50, // New user bonus credits
        isSubscribed: false,
        preferredModel: "gpt-3.5-turbo",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const userSession = {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          credits: newUser.credits,
          isSubscribed: newUser.isSubscribed
        }
      }

      getServerSession.mockResolvedValue(userSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(newUser)

      // 2. USER PURCHASES ADDITIONAL CREDITS
      console.log('🧪 Testing credit purchase...')
      
      const purchasePayment = {
        id: "payment-integration-test",
        userId: newUser.id,
        amount: 19.99,
        currency: "USD",
        status: "completed",
        paymentMethod: "demo",
        transactionId: "demo_integration_test",
        creditsAdded: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.payment.create.mockResolvedValue(purchasePayment)
      
      const userAfterPurchase = { ...newUser, credits: 250 } // 50 + 200
      mockPrismaClient.user.update.mockResolvedValue(userAfterPurchase)

      const purchaseRequest = new NextRequest('http://localhost:3000/api/billing/purchase', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'credits-200',
          amount: 19.99,
          credits: 200
        })
      })

      const purchaseResponse = await PurchasePOST(purchaseRequest)
      const purchaseData = await purchaseResponse.json()

      expect(purchaseResponse.status).toBe(200)
      expect(purchaseData.success).toBe(true)
      expect(purchaseData.newCredits).toBe(250)
      expect(purchaseData.creditsAdded).toBe(200)

      // 3. USER USES CHAT COMPLETION (MULTIPLE TIMES)
      console.log('🧪 Testing chat completions with credit deduction...')
      
      // Update user lookup to return user with 250 credits
      mockPrismaClient.user.findUnique.mockResolvedValue(userAfterPurchase)

      // First chat - should use 1 credit
      const firstChat = {
        id: "chat-1-integration",
        title: "Hello, how are you?",
        messages: [
          {
            role: "user",
            content: "Hello, how are you?",
            timestamp: new Date().toISOString()
          }
        ],
        model: "gpt-3.5-turbo",
        userId: newUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.aIChat.create.mockResolvedValue(firstChat)
      mockPrismaClient.aIChat.update.mockResolvedValue({
        ...firstChat,
        messages: [
          ...firstChat.messages,
          {
            role: "assistant",
            content: "Hello! I'm doing well, thank you for asking. How can I help you today?",
            timestamp: new Date().toISOString()
          }
        ]
      })

      const userAfterFirstChat = { ...userAfterPurchase, credits: 249 }
      mockPrismaClient.user.update.mockResolvedValue(userAfterFirstChat)

      const firstChatRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Hello, how are you?",
          model: "gpt-3.5-turbo"
        })
      })

      const firstChatResponse = await ChatPOST(firstChatRequest)
      const firstChatData = await firstChatResponse.json()

      expect(firstChatResponse.status).toBe(200)
      expect(firstChatData.response).toContain("mock AI response")
      expect(firstChatData.remainingCredits).toBe(249)
      expect(firstChatData.creditsUsed).toBe(1)

      // 4. USER USES EXPENSIVE MODEL (GPT-4)
      console.log('🧪 Testing expensive model usage...')
      
      mockPrismaClient.user.findUnique.mockResolvedValue(userAfterFirstChat)

      const expensiveChat = {
        id: "chat-2-integration",
        title: "Complex question about AI",
        messages: [
          {
            role: "user",
            content: "Explain the philosophical implications of artificial consciousness",
            timestamp: new Date().toISOString()
          }
        ],
        model: "gpt-4",
        userId: newUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.aIChat.create.mockResolvedValue(expensiveChat)
      mockPrismaClient.aIChat.update.mockResolvedValue({
        ...expensiveChat,
        messages: [
          ...expensiveChat.messages,
          {
            role: "assistant",
            content: "The philosophical implications of artificial consciousness are profound and multifaceted...",
            timestamp: new Date().toISOString()
          }
        ]
      })

      const userAfterExpensiveChat = { ...userAfterFirstChat, credits: 246 } // 249 - 3
      mockPrismaClient.user.update.mockResolvedValue(userAfterExpensiveChat)

      const expensiveChatRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Explain the philosophical implications of artificial consciousness",
          model: "gpt-4"
        })
      })

      const expensiveChatResponse = await ChatPOST(expensiveChatRequest)
      const expensiveChatData = await expensiveChatResponse.json()

      expect(expensiveChatResponse.status).toBe(200)
      expect(expensiveChatData.remainingCredits).toBe(246)
      expect(expensiveChatData.creditsUsed).toBe(3)
      expect(expensiveChatData.model).toBe("gpt-4")

      // 5. VERIFY TOTAL CREDITS USED
      console.log('🧪 Verifying total credit flow...')
      
      // Started with 50 + bought 200 = 250
      // Used 1 for first chat + 3 for second chat = 4 total
      // Should have 246 remaining
      expect(expensiveChatData.remainingCredits).toBe(246)

      // 6. VERIFY DATABASE INTERACTIONS
      expect(mockPrismaClient.payment.create).toHaveBeenCalledTimes(1)
      expect(mockPrismaClient.aIChat.create).toHaveBeenCalledTimes(2) 
      expect(mockPrismaClient.user.update).toHaveBeenCalledTimes(3) // 1 purchase + 2 chats

      console.log('✅ Full user flow integration test completed successfully!')
    })

    it('should handle subscription flow correctly', async () => {
      console.log('🧪 Testing subscription flow...')
      
      // Start with a regular user
      const regularUser = {
        id: "sub-test-user",
        email: "subscriber@test.com", 
        name: "Future Subscriber",
        credits: 30,
        isSubscribed: false,
        preferredModel: "gpt-3.5-turbo",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const userSession = {
        user: {
          id: regularUser.id,
          email: regularUser.email,
          name: regularUser.name,
          credits: regularUser.credits,
          isSubscribed: regularUser.isSubscribed
        }
      }

      getServerSession.mockResolvedValue(userSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(regularUser)

      // 1. User subscribes to premium plan
      const subscriptionPayment = {
        id: "sub-payment-test",
        userId: regularUser.id,
        amount: 19.99,
        currency: "USD",
        status: "completed",
        paymentMethod: "demo_subscription",
        transactionId: "sub_test_123",
        creditsAdded: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.payment.create.mockResolvedValue(subscriptionPayment)
      
      const subscribedUser = { ...regularUser, isSubscribed: true }
      mockPrismaClient.user.update.mockResolvedValue(subscribedUser)

      const subscribeRequest = new NextRequest('http://localhost:3000/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro-monthly',
          amount: 19.99
        })
      })

      const subscribeResponse = await SubscribePOST(subscribeRequest)
      const subscribeData = await subscribeResponse.json()

      expect(subscribeResponse.status).toBe(200)
      expect(subscribeData.success).toBe(true)
      expect(subscribeData.isSubscribed).toBe(true)

      // 2. Update session to reflect subscription
      const subscribedSession = {
        user: {
          ...userSession.user,
          isSubscribed: true
        }
      }
      getServerSession.mockResolvedValue(subscribedSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(subscribedUser)

      // 3. Use expensive model multiple times (should not deduct credits)
      const chatWithSubscription = {
        id: "sub-chat-test",
        title: "Premium chat",
        messages: [
          {
            role: "user",
            content: "This is a premium user chat",
            timestamp: new Date().toISOString()
          }
        ],
        model: "gpt-4",
        userId: subscribedUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.aIChat.create.mockResolvedValue(chatWithSubscription)
      mockPrismaClient.aIChat.update.mockResolvedValue(chatWithSubscription)
      
      // For subscribed users, credits shouldn't change
      mockPrismaClient.user.update.mockResolvedValue(subscribedUser)

      const premiumChatRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "This is a premium user chat",
          model: "gpt-4"
        })
      })

      const premiumChatResponse = await ChatPOST(premiumChatRequest)
      const premiumChatData = await premiumChatResponse.json()

      expect(premiumChatResponse.status).toBe(200)
      expect(premiumChatData.remainingCredits).toBe(30) // Credits unchanged
      expect(premiumChatData.creditsUsed).toBe(3) // Shows cost for transparency
      expect(premiumChatData.model).toBe("gpt-4")

      // Verify that only preferred model was updated, not credits
      expect(mockPrismaClient.user.update).toHaveBeenLastCalledWith({
        where: { id: subscribedUser.id },
        data: {
          preferredModel: "gpt-4"
        }
      })

      console.log('✅ Subscription flow test completed successfully!')
    })

    it('should handle edge cases and error scenarios', async () => {
      console.log('🧪 Testing edge cases...')
      
      // Test user running out of credits
      const poorUser = {
        id: "poor-user",
        email: "poor@test.com",
        name: "Credit-Poor User", 
        credits: 1, // Only 1 credit left
        isSubscribed: false,
        preferredModel: "gpt-3.5-turbo",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const poorUserSession = {
        user: {
          id: poorUser.id,
          email: poorUser.email,
          name: poorUser.name,
          credits: poorUser.credits,
          isSubscribed: poorUser.isSubscribed
        }
      }

      getServerSession.mockResolvedValue(poorUserSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(poorUser)

      // Try to use expensive model with insufficient credits
      const expensiveModelRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "I want to use GPT-4",
          model: "gpt-4" // Costs 3 credits, user only has 1
        })
      })

      const insufficientCreditsResponse = await ChatPOST(expensiveModelRequest)
      const insufficientCreditsData = await insufficientCreditsResponse.json()

      expect(insufficientCreditsResponse.status).toBe(403)
      expect(insufficientCreditsData.error).toBe("Insufficient credits")
      expect(insufficientCreditsData.requiredCredits).toBe(3)
      expect(insufficientCreditsData.currentCredits).toBe(1)

      // User can still use cheap model
      mockPrismaClient.aIChat.create.mockResolvedValue({
        id: "cheap-chat",
        title: "Last chat",
        messages: [],
        model: "gpt-3.5-turbo",
        userId: poorUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      mockPrismaClient.aIChat.update.mockResolvedValue({})
      mockPrismaClient.user.update.mockResolvedValue({ ...poorUser, credits: 0 })

      const cheapModelRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "One last message",
          model: "gpt-3.5-turbo" // Costs 1 credit
        })
      })

      const lastChatResponse = await ChatPOST(cheapModelRequest)
      const lastChatData = await lastChatResponse.json()

      expect(lastChatResponse.status).toBe(200)
      expect(lastChatData.remainingCredits).toBe(0)

      // Now user has no credits left
      const emptyUser = { ...poorUser, credits: 0 }
      mockPrismaClient.user.findUnique.mockResolvedValue(emptyUser)

      const noCreditsRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "This should fail",
          model: "gpt-3.5-turbo"
        })
      })

      const noCreditsResponse = await ChatPOST(noCreditsRequest)
      const noCreditsData = await noCreditsResponse.json()

      expect(noCreditsResponse.status).toBe(403)
      expect(noCreditsData.error).toBe("Insufficient credits")

      console.log('✅ Edge cases test completed successfully!')
    })
  })
})