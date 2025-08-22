import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      credits: number
      isSubscribed: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    credits?: number
    isSubscribed?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    sub: string
  }
}
