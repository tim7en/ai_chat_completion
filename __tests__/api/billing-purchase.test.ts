import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/billing/purchase/route'
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

describe('/api/billing/purchase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/billing/purchase', () => {
    it('should successfully purchase credits for authenticated user', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValue(mockSession)
      
      // Mock user lookup
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock payment creation
      mockPrismaClient.payment.create.mockResolvedValue(mockPayment)
      
      // Mock user credit update
      const updatedUser = { ...mockUser, credits: mockUser.credits + 100 }
      mockPrismaClient.user.update.mockResolvedValue(updatedUser)

      const request = new NextRequest('http://localhost:3000/api/billing/purchase', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'credits-100',
          amount: 9.99,
          credits: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.newCredits).toBe(150) // 50 + 100
      expect(data.creditsAdded).toBe(100)
      expect(data.paymentId).toBe(mockPayment.id)

      // Verify database calls
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockSession.user.id }
      })
      expect(mockPrismaClient.payment.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          amount: 9.99,
          currency: "USD",
          status: "completed",
          paymentMethod: "demo",
          transactionId: expect.stringMatching(/^demo_\d+$/),
          creditsAdded: 100
        }
      })
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          credits: 150
        }
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/billing/purchase', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'credits-100',
          amount: 9.99,
          credits: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid request data', async () => {
      getServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/billing/purchase', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'credits-100',
          // Missing amount and credits
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

      const request = new NextRequest('http://localhost:3000/api/billing/purchase', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'credits-100',
          amount: 9.99,
          credits: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should handle different credit amounts correctly', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
      
      const paymentWith500Credits = { ...mockPayment, creditsAdded: 500 }
      mockPrismaClient.payment.create.mockResolvedValue(paymentWith500Credits)
      
      const updatedUserWith500Credits = { ...mockUser, credits: 550 }
      mockPrismaClient.user.update.mockResolvedValue(updatedUserWith500Credits)

      const request = new NextRequest('http://localhost:3000/api/billing/purchase', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'credits-500',
          amount: 39.99,
          credits: 500
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.newCredits).toBe(550)
      expect(data.creditsAdded).toBe(500)
    })

    it('should handle database errors gracefully', async () => {
      getServerSession.mockResolvedValue(mockSession)
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/billing/purchase', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'credits-100',
          amount: 9.99,
          credits: 100
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})