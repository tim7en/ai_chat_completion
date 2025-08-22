import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { mockPrismaClient, mockSession, mockSubscribedSession, mockUser, mockSubscribedUser, mockChat, mockZAI } from '../utils/test-mocks'

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
      },
      'claude-3-opus': {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Most capable',
        creditsPerMessage: 5,
        maxTokens: 200000,
        category: 'premium'
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

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/chat', () => {
    it('should successfully create chat completion for user with sufficient credits', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValue(mockSession)
      
      // Mock user lookup with sufficient credits
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock chat creation
      mockPrismaClient.aIChat.create.mockResolvedValue(mockChat)
      
      // Mock chat update with AI response
      const updatedChat = {
        ...mockChat,
        messages: [
          ...mockChat.messages,
          {
            role: "assistant",
            content: "This is a mock AI response for testing purposes.",
            timestamp: new Date().toISOString()
          }
        ]
      }
      mockPrismaClient.aIChat.update.mockResolvedValue(updatedChat)
      
      // Mock user credit deduction
      const updatedUser = { ...mockUser, credits: mockUser.credits - 1 }
      mockPrismaClient.user.update.mockResolvedValue(updatedUser)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Hello, how are you?",
          model: "gpt-3.5-turbo"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.response).toBe("This is a mock AI response for testing purposes.")
      expect(data.chatId).toBe(mockChat.id)
      expect(data.remainingCredits).toBe(49) // 50 - 1
      expect(data.model).toBe("gpt-3.5-turbo")
      expect(data.modelName).toBe("GPT-3.5 Turbo")
      expect(data.creditsUsed).toBe(1)

      // Verify database calls
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockSession.user.id }
      })
      expect(mockPrismaClient.aIChat.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          title: "Hello, how are you?",
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: "Hello, how are you?",
            timestamp: expect.any(String)
          }]
        }
      })
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          credits: 49,
          preferredModel: "gpt-3.5-turbo"
        }
      })
    })

    it('should continue existing chat conversation', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock existing chat lookup
      mockPrismaClient.aIChat.findUnique.mockResolvedValue(mockChat)
      
      // Mock chat update with new message
      const updatedChatWithNewMessage = {
        ...mockChat,
        messages: [
          ...mockChat.messages,
          {
            role: "user", 
            content: "What's the weather like?",
            timestamp: new Date().toISOString()
          }
        ]
      }
      mockPrismaClient.aIChat.update.mockResolvedValueOnce(updatedChatWithNewMessage)
      
      // Mock final update with AI response
      const finalUpdatedChat = {
        ...updatedChatWithNewMessage,
        messages: [
          ...updatedChatWithNewMessage.messages,
          {
            role: "assistant",
            content: "This is a mock AI response for testing purposes.", 
            timestamp: new Date().toISOString()
          }
        ]
      }
      mockPrismaClient.aIChat.update.mockResolvedValueOnce(finalUpdatedChat)
      
      const updatedUser = { ...mockUser, credits: 49 }
      mockPrismaClient.user.update.mockResolvedValue(updatedUser)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "What's the weather like?",
          model: "gpt-3.5-turbo",
          chatId: mockChat.id
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.chatId).toBe(mockChat.id)
      expect(mockPrismaClient.aIChat.findUnique).toHaveBeenCalledWith({
        where: { id: mockChat.id, userId: mockUser.id }
      })
    })

    it('should return 403 for insufficient credits', async () => {
      // Mock user with insufficient credits
      const poorUser = { ...mockUser, credits: 0 }
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(poorUser)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Hello, how are you?",
          model: "gpt-3.5-turbo"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Insufficient credits")
      expect(data.requiredCredits).toBe(1)
      expect(data.currentCredits).toBe(0)
    })

    it('should allow unlimited usage for subscribed users', async () => {
      // Mock subscribed user
      getServerSession.mockResolvedValue(mockSubscribedSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(mockSubscribedUser)
      
      mockPrismaClient.aIChat.create.mockResolvedValue({
        ...mockChat,
        userId: mockSubscribedUser.id
      })
      
      const updatedChat = {
        ...mockChat,
        userId: mockSubscribedUser.id,
        messages: [
          ...mockChat.messages,
          {
            role: "assistant",
            content: "This is a mock AI response for testing purposes.",
            timestamp: new Date().toISOString()
          }
        ]
      }
      mockPrismaClient.aIChat.update.mockResolvedValue(updatedChat)
      
      // Subscribed users should only update preferred model, not deduct credits
      mockPrismaClient.user.update.mockResolvedValue(mockSubscribedUser)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Hello, how are you?",
          model: "gpt-4"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.remainingCredits).toBe(100) // No credits deducted
      expect(data.creditsUsed).toBe(3) // Still shows cost for transparency

      // Verify only preferred model is updated, not credits
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: mockSubscribedUser.id },
        data: {
          preferredModel: "gpt-4"
        }
      })
    })

    it('should handle expensive models correctly', async () => {
      getServerSession.mockResolvedValue(mockSession)
      
      // User with enough credits for expensive model
      const richUser = { ...mockUser, credits: 100 }
      mockPrismaClient.user.findUnique.mockResolvedValue(richUser)
      
      mockPrismaClient.aIChat.create.mockResolvedValue(mockChat)
      mockPrismaClient.aIChat.update.mockResolvedValue(mockChat)
      
      const updatedUser = { ...richUser, credits: 95 } // 100 - 5
      mockPrismaClient.user.update.mockResolvedValue(updatedUser)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Complex reasoning task",
          model: "claude-3-opus"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creditsUsed).toBe(5)
      expect(data.remainingCredits).toBe(95)
      expect(data.model).toBe("claude-3-opus")
    })

    it('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Hello",
          model: "gpt-3.5-turbo"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })

    it('should handle invalid model gracefully', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Hello",
          model: "invalid-model"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid model")
    })

    it('should handle Z-AI SDK errors gracefully', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock Z-AI SDK to throw error
      mockZAI.create.mockRejectedValueOnce(new Error('AI service unavailable'))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Hello",
          model: "gpt-3.5-turbo"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Internal server error")
    })

    it('should include comprehensive response data like ChatGPT API', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      // Enhanced mock response with more ChatGPT-like data
      const enhancedMockResponse = {
        choices: [{
          message: {
            content: "This is a comprehensive AI response with detailed information.",
            role: "assistant"
          },
          finish_reason: "stop",
          index: 0
        }],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 25,
          total_tokens: 40
        },
        model: "gpt-3.5-turbo-0613",
        id: "chatcmpl-test123456",
        object: "chat.completion",
        created: 1677652288
      }
      
      mockZAI.create.mockResolvedValue({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(enhancedMockResponse)
          }
        }
      })
      
      mockPrismaClient.aIChat.create.mockResolvedValue(mockChat)
      mockPrismaClient.aIChat.update.mockResolvedValue(mockChat)
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, credits: 49 })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Tell me about artificial intelligence",
          model: "gpt-3.5-turbo"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        response: "This is a comprehensive AI response with detailed information.",
        chatId: expect.any(String),
        remainingCredits: 49,
        model: "gpt-3.5-turbo",
        modelName: "GPT-3.5 Turbo", 
        creditsUsed: 1
      })
    })
  })
})