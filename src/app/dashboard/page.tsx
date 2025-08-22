"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/ui/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { toast } from "sonner"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userStats, setUserStats] = useState({
    totalChats: 0,
    creditsUsed: 0,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      // Fetch user stats (mock data for now)
      setUserStats({
        totalChats: 5,
        creditsUsed: 15,
      })
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
            <p className="text-muted-foreground">
              Ready to explore the power of AI?
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
              <AvatarFallback>
                {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{session.user.name || "User"}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {session.user.credits} credits
                </Badge>
                {session.user.isSubscribed && (
                  <Badge variant="default">PRO</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
              <Icons.user className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalChats}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
              <Icons.user className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.creditsUsed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
              <Icons.user className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.user.credits}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Start New Chat</CardTitle>
              <CardDescription>
                Begin a conversation with our AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">
                  Each chat consumes credits based on the model used. You have {session.user.credits} credits remaining.
                </p>
                <Link href="/chat">
                  <Button className="w-full">
                    Start Chatting
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get More Credits</CardTitle>
              <CardDescription>
                Purchase additional credits for AI conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">
                  Buy credit packs or upgrade to a subscription for unlimited access.
                </p>
                <Link href="/billing">
                  <Button className="w-full" variant="outline">
                    Buy Credits
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Banner */}
        {!session.user.isSubscribed && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Upgrade to Pro</span>
                <Badge variant="default">PRO</Badge>
              </CardTitle>
              <CardDescription>
                Unlock unlimited AI conversations and premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <ul className="text-sm space-y-2">
                  <li className="flex items-center space-x-2">
                    <Icons.user className="h-4 w-4 text-green-500" />
                    <span>Unlimited AI chats</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.user className="h-4 w-4 text-green-500" />
                    <span>Priority access to new features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Icons.user className="h-4 w-4 text-green-500" />
                    <span>Advanced AI models</span>
                  </li>
                </ul>
                <Link href="/billing">
                  <Button className="w-full">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}