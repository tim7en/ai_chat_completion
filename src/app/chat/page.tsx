"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AIModelSelector } from "@/components/ai-model-selector"
import { aiModels, AIModel } from "@/lib/ai-models"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [selectedModel, setSelectedModel] = useState<AIModel>(aiModels[0])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return
    if (!session) {
      toast.error("Please sign in to chat")
      return
    }

    const requiredCredits = selectedModel.creditsPerMessage

    // Check if user has enough credits or is subscribed
    if (session.user.credits < requiredCredits && !session.user.isSubscribed) {
      setShowPaywall(true)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      model: selectedModel.id
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          chatId,
          model: selectedModel.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        model: selectedModel.id
      }

      setMessages((prev) => [...prev, assistantMessage])
      
      if (data.chatId) {
        setChatId(data.chatId)
      }

      // Update user credits in session
      if (data.remainingCredits !== undefined) {
        toast.success(`${selectedModel.name} response ready! Credits remaining: ${data.remainingCredits}`)
      }
    } catch (error) {
      toast.error("Failed to get response from AI")
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setChatId(null)
  }

  const handleUpgrade = () => {
    router.push("/billing")
    setShowPaywall(false)
  }

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

  const requiredCredits = selectedModel.creditsPerMessage
  const hasEnoughCredits = session.user.credits >= requiredCredits || session.user.isSubscribed

  const getModelColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      indigo: "bg-indigo-100 text-indigo-800",
      orange: "bg-orange-100 text-orange-800",
      yellow: "bg-yellow-100 text-yellow-800",
      green: "bg-green-100 text-green-800"
    }
    return colorMap[color] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="flex h-screen">
      {/* Paywall Modal */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Icons.user className="h-5 w-5" />
              <span>Insufficient Credits</span>
            </DialogTitle>
            <DialogDescription>
              You need {requiredCredits} credit{requiredCredits !== 1 ? 's' : ''} to use {selectedModel.name}, but you only have {session.user.credits}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Model Cost</span>
                <Badge variant="destructive">{requiredCredits} credit{requiredCredits !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Credits</span>
                <Badge variant="secondary">{session.user.credits}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedModel.name} requires {requiredCredits} credit{requiredCredits !== 1 ? 's' : ''} per message.
              </p>
            </div>
            
            <div className="grid gap-3">
              <div className="space-y-2">
                <h4 className="font-medium">Quick Options:</h4>
                <div className="grid gap-2">
                  <Button onClick={handleUpgrade} className="w-full">
                    💎 Get More Credits
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPaywall(false)}
                    className="w-full"
                  >
                    Choose Different Model
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10">
        <div className="p-4 space-y-4">
          <Button onClick={startNewChat} className="w-full" variant="outline">
            <Icons.user className="mr-2 h-4 w-4" />
            New Chat
          </Button>
          
          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <AIModelSelector 
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Credits</span>
              <Badge 
                variant={session.user.credits > 10 ? "secondary" : "destructive"}
                className={session.user.credits > 10 ? "" : "animate-pulse"}
              >
                {session.user.credits}
              </Badge>
            </div>
            
            {session.user.isSubscribed && (
              <Badge variant="default" className="w-full justify-center">
                PRO - Unlimited
              </Badge>
            )}
            
            {/* Current Model Info */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Current Model</span>
                <Badge variant="outline" className="text-xs">
                  {selectedModel.creditsPerMessage} credit{selectedModel.creditsPerMessage !== 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedModel.name}
              </p>
            </div>
            
            {session.user.credits <= 5 && session.user.credits > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
                ⚠️ Low credits! Get more to continue chatting.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold">AI Chat</h1>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={cn(
                    "text-xs font-medium",
                    getModelColorClass(selectedModel.color)
                  )}>
                    {selectedModel.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{selectedModel.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {session.user.isSubscribed ? "Free" : `${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} per message`}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={hasEnoughCredits ? "outline" : "destructive"}
                className={!hasEnoughCredits ? "animate-pulse" : ""}
              >
                {session.user.credits} credits
              </Badge>
              {session.user.isSubscribed && (
                <Badge variant="default">PRO</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Icons.user className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Welcome to AI Chat</h3>
                <p className="text-muted-foreground mb-4">
                  Start a conversation with {selectedModel.name}. Each message costs {selectedModel.creditsPerMessage} credit{selectedModel.creditsPerMessage !== 1 ? 's' : ''}.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg inline-block">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    🎉 New users get 50 free credits!
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message) => {
              const messageModel = aiModels.find(m => m.id === message.model)
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card
                    className={`max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {message.role === "user" ? "You" : messageModel?.name || "AI Assistant"}
                        </CardTitle>
                        {messageModel && (
                          <Badge 
                            variant={message.role === "user" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {messageModel.name}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{selectedModel.name} is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          {!hasEnoughCredits ? (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Insufficient credits for {selectedModel.name}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Need {requiredCredits} credits. Get more or choose a different model.
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleUpgrade} size="sm">
                      Get Credits
                    </Button>
                    <AIModelSelector 
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </form>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {session.user.isSubscribed 
                ? "Unlimited chats with Pro subscription"
                : `Using ${selectedModel.name} (${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} per message). ${session.user.credits} credits remaining.`
              }
            </p>
            {session.user.credits <= requiredCredits * 3 && session.user.credits > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUpgrade}
                className="text-xs"
              >
                Get More Credits
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}