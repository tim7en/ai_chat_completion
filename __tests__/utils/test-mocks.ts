// Mock Prisma client for testing
export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  aIChat: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  account: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}

// Mock Z-AI SDK
export const mockZAI = {
  create: jest.fn().mockResolvedValue({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "This is a mock AI response for testing purposes."
              }
            }
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25
          },
          model: "gpt-3.5-turbo",
          id: "chatcmpl-test123",
          object: "chat.completion",
          created: Date.now()
        })
      }
    }
  })
}

// Mock NextAuth session
export const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    credits: 50,
    isSubscribed: false
  }
}

export const mockSubscribedSession = {
  user: {
    id: "test-user-id-sub",
    email: "subscriber@example.com", 
    name: "Subscribed User",
    credits: 100,
    isSubscribed: true
  }
}

// Mock user data
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  credits: 50,
  isSubscribed: false,
  preferredModel: "gpt-3.5-turbo",
  createdAt: new Date(),
  updatedAt: new Date()
}

export const mockSubscribedUser = {
  id: "test-user-id-sub",
  email: "subscriber@example.com",
  name: "Subscribed User", 
  credits: 100,
  isSubscribed: true,
  preferredModel: "gpt-4",
  createdAt: new Date(),
  updatedAt: new Date()
}

// Mock chat data
export const mockChat = {
  id: "test-chat-id",
  title: "Test Chat",
  messages: [
    {
      role: "user",
      content: "Hello, how are you?",
      timestamp: new Date().toISOString()
    }
  ],
  model: "gpt-3.5-turbo",
  userId: "test-user-id",
  createdAt: new Date(),
  updatedAt: new Date()
}

// Test mocks and utilities file - this file exports mocks but doesn't contain tests
export default {};