import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { z } from "zod"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const loginSchema = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })

        const validatedFields = loginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          // Check if user exists
          let user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            // Create new user with 50 bonus credits for registration
            user = await db.user.create({
              data: {
                email,
                name: email.split("@")[0],
                credits: 50, // Bonus credits for new users
              },
            })
          }

          return user
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      
      // Add bonus credits for new OAuth users
      if (account && user) {
        const existingUser = await db.user.findUnique({
          where: { id: user.id }
        })
        
        if (existingUser && existingUser.credits === 10) { // Default credits
          await db.user.update({
            where: { id: user.id },
            data: { credits: 50 } // Bonus credits for new OAuth users
          })
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        // Fetch user data from database
        const user = await db.user.findUnique({
          where: { id: token.sub },
        })
        if (user) {
          session.user.credits = user.credits
          session.user.isSubscribed = user.isSubscribed
        }
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      // Add bonus credits for new users
      if (user && user.id) {
        const existingUser = await db.user.findUnique({
          where: { id: user.id }
        })
        
        if (existingUser && existingUser.credits === 10) { // Default credits
          await db.user.update({
            where: { id: user.id },
            data: { credits: 50 } // Bonus credits for new users
          })
        }
      }
    }
  }
}