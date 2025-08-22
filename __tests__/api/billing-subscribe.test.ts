import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/billing/subscribe/route'
import { mockPrismaClient, mockSession, mockUser, mockPayment } from '../utils/test-mocks'

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

const { getServerSession } = require('next-auth')

describe('/api/billing/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/billing/subscribe', () => {
    it('should successfully subscribe user to premium plan', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValue(mockSession)
      
      // Mock user lookup
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock subscription payment creation
      const subscriptionPayment = {
        ...mockPayment,
        paymentMethod: "demo_subscription",
        transactionId: "sub_123456789",
        creditsAdded: 0
      }
      mockPrismaClient.payment.create.mockResolvedValue(subscriptionPayment)
      
      // Mock user subscription update
      const subscribedUser = { ...mockUser, isSubscribed: true }
      mockPrismaClient.user.update.mockResolvedValue(subscribedUser)

      const request = new NextRequest('http://localhost:3000/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro-monthly',
          amount: 19.99
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.isSubscribed).toBe(true)
      expect(data.paymentId).toBe(subscriptionPayment.id)

      // Verify database calls
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockSession.user.id }
      })
      expect(mockPrismaClient.payment.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          amount: 19.99,
          currency: "USD",
          status: "completed",
          paymentMethod: "demo_subscription",
          transactionId: expect.stringMatching(/^sub_\d+$/),
          creditsAdded: 0
        }
      })
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          isSubscribed: true
        }
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro-monthly',
          amount: 19.99
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid request data', async () => {
      getServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro-monthly',
          // Missing amount
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('should return 404 when user not found', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro-monthly',
          amount: 19.99
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should handle different subscription plans', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      const yearlyPayment = {
        ...mockPayment,
        amount: 199.99,
        paymentMethod: "demo_subscription",
        transactionId: "sub_yearly_123456789",
        creditsAdded: 0
      }
      mockPrismaClient.payment.create.mockResolvedValue(yearlyPayment)
      
      const subscribedUser = { ...mockUser, isSubscribed: true }
      mockPrismaClient.user.update.mockResolvedValue(subscribedUser)

      const request = new NextRequest('http://localhost:3000/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro-yearly',
          amount: 199.99
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.isSubscribed).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'pro-monthly',
          amount: 19.99
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})