import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { mockPrismaClient, mockUser, mockSession } from '../utils/test-mocks'

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
  getModelById: jest.fn((id) => ({
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient',
    creditsPerMessage: 1,
    maxTokens: 4096,
    category: 'basic'
  }))
}))

// Enhanced mock Z-AI SDK that returns comprehensive ChatGPT-like responses
const createMockZAIResponse = (overrides = {}) => ({
  choices: [{
    message: {
      content: "This is a comprehensive AI response with detailed analysis and helpful information.",
      role: "assistant"
    },
    finish_reason: "stop",
    index: 0,
    ...overrides.choice
  }],
  usage: {
    prompt_tokens: 25,
    completion_tokens: 150,
    total_tokens: 175,
    ...overrides.usage
  },
  model: "gpt-3.5-turbo-0613",
  id: "chatcmpl-8xyz123456789",
  object: "chat.completion",
  created: 1677652288,
  system_fingerprint: "fp_44709d6fcb",
  ...overrides.base
})

jest.mock('z-ai-web-dev-sdk', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(createMockZAIResponse())
        }
      }
    })
  }
}))

const { getServerSession } = require('next-auth')
const ZAI = require('z-ai-web-dev-sdk').default

describe('ChatGPT API-like Response Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getServerSession.mockResolvedValue(mockSession)
    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
  })

  describe('Comprehensive API Response Format', () => {
    it('should return ChatGPT-compatible response structure', async () => {
      const enhancedResponse = createMockZAIResponse({
        choice: {
          message: {
            content: "I'm an AI assistant created by OpenAI. I can help you with a wide variety of tasks including answering questions, writing, analysis, math, coding, and creative projects. How can I assist you today?",
            role: "assistant"
          },
          finish_reason: "stop"
        },
        usage: {
          prompt_tokens: 12,
          completion_tokens: 45,
          total_tokens: 57
        },
        base: {
          model: "gpt-3.5-turbo-0613",
          id: "chatcmpl-8ABCxyz123",
          created: Math.floor(Date.now() / 1000)
        }
      })

      ZAI.create().then(zai => {
        zai.chat.completions.create.mockResolvedValue(enhancedResponse)
      })

      const mockChat = {
        id: "comprehensive-chat-test",
        title: "Who are you?",
        messages: [],
        model: "gpt-3.5-turbo",
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.aIChat.create.mockResolvedValue(mockChat)
      mockPrismaClient.aIChat.update.mockResolvedValue(mockChat)
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, credits: 49 })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Who are you?",
          model: "gpt-3.5-turbo"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      // Test standard response fields
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('response')
      expect(data).toHaveProperty('chatId')
      expect(data).toHaveProperty('remainingCredits')
      expect(data).toHaveProperty('model')
      expect(data).toHaveProperty('modelName')
      expect(data).toHaveProperty('creditsUsed')

      // Test response content
      expect(typeof data.response).toBe('string')
      expect(data.response.length).toBeGreaterThan(0)
      expect(data.chatId).toBe(mockChat.id)
      expect(data.remainingCredits).toBe(49)
      expect(data.model).toBe('gpt-3.5-turbo')
      expect(data.modelName).toBe('GPT-3.5 Turbo')
      expect(data.creditsUsed).toBe(1)
    })

    it('should handle different message types and contexts', async () => {
      const conversationScenarios = [
        {
          message: "Hello, how are you?",
          expectedType: "greeting",
          mockResponse: "Hello! I'm doing well, thank you for asking. I'm here and ready to help you with any questions or tasks you might have. How are you doing today?"
        },
        {
          message: "Write a Python function to calculate fibonacci numbers",
          expectedType: "coding",
          mockResponse: `Here's a Python function to calculate Fibonacci numbers:

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# More efficient iterative version:
def fibonacci_iterative(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
\`\`\`

The first version uses recursion, while the second is more efficient for larger numbers.`
        },
        {
          message: "Explain quantum computing in simple terms",
          expectedType: "explanation",
          mockResponse: "Quantum computing is like having a super-powered computer that works fundamentally differently from regular computers. While regular computers process information in bits (0s and 1s), quantum computers use quantum bits or 'qubits' that can be both 0 and 1 simultaneously. This allows them to explore many possible solutions at once, making them potentially much faster for certain complex problems like cryptography, drug discovery, and optimization challenges."
        }
      ]

      for (const scenario of conversationScenarios) {
        // Reset mocks for each scenario
        jest.clearAllMocks()
        getServerSession.mockResolvedValue(mockSession)
        mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

        const mockResponse = createMockZAIResponse({
          choice: {
            message: {
              content: scenario.mockResponse,
              role: "assistant"
            }
          },
          usage: {
            prompt_tokens: scenario.message.length / 4, // Rough estimate
            completion_tokens: scenario.mockResponse.length / 4,
            total_tokens: (scenario.message.length + scenario.mockResponse.length) / 4
          }
        })

        ZAI.create().then(zai => {
          zai.chat.completions.create.mockResolvedValue(mockResponse)
        })

        const chatId = `chat-${scenario.expectedType}-test`
        const mockChat = {
          id: chatId,
          title: scenario.message.slice(0, 50),
          messages: [],
          model: "gpt-3.5-turbo",
          userId: mockUser.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        mockPrismaClient.aIChat.create.mockResolvedValue(mockChat)
        mockPrismaClient.aIChat.update.mockResolvedValue(mockChat)
        mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, credits: 49 })

        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: scenario.message,
            model: "gpt-3.5-turbo"
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.response).toBe(scenario.mockResponse)
        expect(data.chatId).toBe(chatId)

        console.log(`✅ ${scenario.expectedType} scenario tested successfully`)
      }
    })

    it('should handle long conversations with context', async () => {
      const existingChat = {
        id: "long-conversation-test",
        title: "Extended conversation",
        messages: [
          {
            role: "user",
            content: "What is machine learning?",
            timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
          },
          {
            role: "assistant", 
            content: "Machine learning is a subset of artificial intelligence (AI) that enables computers to learn and improve from experience without being explicitly programmed for every task.",
            timestamp: new Date(Date.now() - 240000).toISOString() // 4 minutes ago
          },
          {
            role: "user",
            content: "Can you give me an example?",
            timestamp: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
          },
          {
            role: "assistant",
            content: "A common example is email spam detection. Instead of programming specific rules, the system learns from thousands of examples of spam and legitimate emails to identify patterns and classify new emails automatically.",
            timestamp: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
          }
        ],
        model: "gpt-3.5-turbo",
        userId: mockUser.id,
        createdAt: new Date(Date.now() - 600000), // 10 minutes ago
        updatedAt: new Date(Date.now() - 120000) // 2 minutes ago
      }

      mockPrismaClient.aIChat.findUnique.mockResolvedValue(existingChat)

      const contextualResponse = createMockZAIResponse({
        choice: {
          message: {
            content: "Certainly! Building on the spam detection example I mentioned, here are a few more practical applications:\n\n1. **Recommendation Systems**: Netflix suggests movies based on your viewing history and preferences of similar users.\n\n2. **Image Recognition**: Your phone's camera can identify and tag people in photos automatically.\n\n3. **Voice Assistants**: Siri, Alexa, and Google Assistant understand and respond to spoken commands.\n\n4. **Fraud Detection**: Banks use ML to detect unusual spending patterns that might indicate fraudulent transactions.\n\nEach of these systems learned from vast amounts of data to recognize patterns and make predictions or decisions.",
            role: "assistant"
          }
        },
        usage: {
          prompt_tokens: 180, // Longer prompt due to conversation history
          completion_tokens: 120,
          total_tokens: 300
        }
      })

      ZAI.create().then(zai => {
        zai.chat.completions.create.mockResolvedValue(contextualResponse)
      })

      const updatedChat = {
        ...existingChat,
        messages: [
          ...existingChat.messages,
          {
            role: "user",
            content: "Can you give me more examples?",
            timestamp: new Date().toISOString()
          }
        ]
      }

      mockPrismaClient.aIChat.update.mockResolvedValueOnce(updatedChat)
      mockPrismaClient.aIChat.update.mockResolvedValueOnce({
        ...updatedChat,
        messages: [
          ...updatedChat.messages,
          {
            role: "assistant",
            content: contextualResponse.choices[0].message.content,
            timestamp: new Date().toISOString()
          }
        ]
      })

      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, credits: 49 })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Can you give me more examples?",
          model: "gpt-3.5-turbo",
          chatId: existingChat.id
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.response).toContain("Building on the spam detection example")
      expect(data.response).toContain("Recommendation Systems")
      expect(data.chatId).toBe(existingChat.id)

      // Verify that the existing chat was found and updated
      expect(mockPrismaClient.aIChat.findUnique).toHaveBeenCalledWith({
        where: { id: existingChat.id, userId: mockUser.id }
      })
    })

    it('should handle various AI response types and edge cases', async () => {
      const responseScenarios = [
        {
          name: "Empty response handling",
          mockResponse: createMockZAIResponse({
            choice: {
              message: {
                content: "",
                role: "assistant"
              }
            }
          }),
          expectedFallback: "I'm sorry, I couldn't generate a response."
        },
        {
          name: "Very long response",
          mockResponse: createMockZAIResponse({
            choice: {
              message: {
                content: "This is a very long response that simulates when an AI generates extensive content. ".repeat(50),
                role: "assistant"
              }
            },
            usage: {
              prompt_tokens: 20,
              completion_tokens: 500,
              total_tokens: 520
            }
          })
        },
        {
          name: "Response with markdown and code",
          mockResponse: createMockZAIResponse({
            choice: {
              message: {
                content: `# Here's a solution with code:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

**Key points:**
- Uses template literals
- Simple and clean
- Easy to understand

*Hope this helps!*`,
                role: "assistant"
              }
            }
          })
        },
        {
          name: "Response cut off (max tokens reached)",
          mockResponse: createMockZAIResponse({
            choice: {
              message: {
                content: "This response was cut off because it reached the maximum token",
                role: "assistant"
              },
              finish_reason: "length"
            }
          })
        }
      ]

      for (const scenario of responseScenarios) {
        jest.clearAllMocks()
        getServerSession.mockResolvedValue(mockSession)
        mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

        ZAI.create().then(zai => {
          zai.chat.completions.create.mockResolvedValue(scenario.mockResponse)
        })

        const mockChat = {
          id: `chat-${scenario.name.replace(/\s+/g, '-').toLowerCase()}`,
          title: "Test scenario",
          messages: [],
          model: "gpt-3.5-turbo",
          userId: mockUser.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        mockPrismaClient.aIChat.create.mockResolvedValue(mockChat)
        mockPrismaClient.aIChat.update.mockResolvedValue(mockChat)
        mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, credits: 49 })

        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: `Test ${scenario.name}`,
            model: "gpt-3.5-turbo"
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        if (scenario.expectedFallback) {
          expect(data.response).toBe(scenario.expectedFallback)
        } else {
          expect(data.response).toBe(scenario.mockResponse.choices[0].message.content)
        }

        console.log(`✅ ${scenario.name} tested successfully`)
      }
    })

    it('should handle token usage and billing information accurately', async () => {
      const highUsageResponse = createMockZAIResponse({
        usage: {
          prompt_tokens: 1500,
          completion_tokens: 2000,
          total_tokens: 3500
        },
        choice: {
          message: {
            content: "This is a response that consumed a lot of tokens due to long context and detailed response."
          }
        }
      })

      ZAI.create().then(zai => {
        zai.chat.completions.create.mockResolvedValue(highUsageResponse)
      })

      const mockChat = {
        id: "high-usage-test",
        title: "Complex query",
        messages: [],
        model: "gpt-3.5-turbo",
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrismaClient.aIChat.create.mockResolvedValue(mockChat)
      mockPrismaClient.aIChat.update.mockResolvedValue(mockChat)
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, credits: 49 })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: "Please provide a comprehensive analysis of renewable energy technologies, their current market adoption, future prospects, environmental impact, and economic considerations across different regions globally.",
          model: "gpt-3.5-turbo"
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creditsUsed).toBe(1) // Model-based credit cost
      expect(data.remainingCredits).toBe(49)
      
      // The response should be properly formatted regardless of token usage
      expect(typeof data.response).toBe('string')
      expect(data.response.length).toBeGreaterThan(0)
    })
  })
})