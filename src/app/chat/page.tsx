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
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
}

interface ChatHistory {
  id: string
  title: string
  messages: any[]
  model: string
  createdAt: string
  updatedAt: string
}

export default function ChatPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [selectedModel, setSelectedModel] = useState<AIModel>(aiModels[0])
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [currentCredits, setCurrentCredits] = useState(session?.user?.credits || 0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      setCurrentCredits(session.user.credits)
      fetchChatHistory()
    }
  }, [session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChatHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch("/api/chats")
      if (response.ok) {
        const data = await response.json()
        setChatHistory(data.chats || [])
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadChat = async (selectedChatId: string) => {
    try {
      const response = await fetch(`/api/chats/${selectedChatId}`)
      if (response.ok) {
        const data = await response.json()
        const chat = data.chat
        
        setChatId(chat.id)
        
        // Convert stored messages to UI format
        const convertedMessages = Array.isArray(chat.messages) 
          ? chat.messages.map((msg: any, index: number) => ({
              id: `${chat.id}-${index}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp || chat.createdAt),
              model: chat.model
            }))
          : []
        
        setMessages(convertedMessages)
        
        // Update selected model if different
        const chatModel = aiModels.find(m => m.id === chat.model)
        if (chatModel) {
          setSelectedModel(chatModel)
        }
      }
    } catch (error) {
      toast.error("Failed to load chat")
    }
  }

  const exportChatAsText = () => {
    if (messages.length === 0) {
      toast.error("No messages to export")
      return
    }

    const chatContent = messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString()
      const sender = msg.role === 'user' ? 'You' : selectedModel.name
      return `[${timestamp}] ${sender}:\n${msg.content}\n`
    }).join('\n')

    const blob = new Blob([
      `AI Chat Hub - Conversation Export\n` +
      `=================================\n\n` +
      `Model: ${selectedModel.name}\n` +
      `Date: ${new Date().toLocaleString()}\n` +
      `Messages: ${messages.length}\n\n` +
      chatContent
    ], { type: 'text/plain' })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("Chat exported as text file")
  }

  const exportChatAsHTML = () => {
    if (messages.length === 0) {
      toast.error("No messages to export")
      return
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Export</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
        .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
        .user { background-color: #dbeafe; margin-left: 50px; }
        .assistant { background-color: #f3f4f6; margin-right: 50px; }
        .sender { font-weight: bold; margin-bottom: 5px; color: #374151; }
        .timestamp { font-size: 0.875rem; color: #6b7280; }
        .content { white-space: pre-wrap; }
        code { background-color: #f9fafb; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Chat Hub - Conversation Export</h1>
        <p><strong>Model:</strong> ${selectedModel.name}</p>
        <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Messages:</strong> ${messages.length}</p>
    </div>
    <div class="conversation">
        ${messages.map(msg => `
            <div class="message ${msg.role}">
                <div class="sender">${msg.role === 'user' ? 'You' : selectedModel.name}</div>
                <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
                <div class="content">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chat-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("Chat exported as HTML file")
  }

  const deleteChat = async (chatIdToDelete: string) => {
    try {
      const response = await fetch(`/api/chats/${chatIdToDelete}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast.success("Chat deleted")
        setChatHistory(prev => prev.filter(chat => chat.id !== chatIdToDelete))
        
        // If this was the current chat, start a new one
        if (chatId === chatIdToDelete) {
          startNewChat()
        }
      } else {
        toast.error("Failed to delete chat")
      }
    } catch (error) {
      toast.error("Failed to delete chat")
    }
  }
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
    if (currentCredits < requiredCredits && !session.user.isSubscribed) {
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

      // Update credits in real-time
      if (data.remainingCredits !== undefined) {
        setCurrentCredits(data.remainingCredits)
        // Update session data
        await update()
        toast.success(`${selectedModel.name} response ready! Credits remaining: ${data.remainingCredits}`)
      }

      // Refresh chat history to show new/updated chat
      fetchChatHistory()
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
  const hasEnoughCredits = currentCredits >= requiredCredits || session?.user?.isSubscribed

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
              You need {requiredCredits} credit{requiredCredits !== 1 ? 's' : ''} to use {selectedModel.name}, but you only have {currentCredits}.
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
                <Badge variant="secondary">{currentCredits}</Badge>
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
          
          {/* Export Options */}
          {messages.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Chat</label>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={exportChatAsText} variant="outline" size="sm">
                  <Icons.user className="mr-1 h-3 w-3" />
                  TXT
                </Button>
                <Button onClick={exportChatAsHTML} variant="outline" size="sm">
                  <Icons.user className="mr-1 h-3 w-3" />
                  HTML
                </Button>
              </div>
            </div>
          )}
          
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
                variant={currentCredits > 10 ? "secondary" : "destructive"}
                className={currentCredits > 10 ? "" : "animate-pulse"}
              >
                {currentCredits}
              </Badge>
            </div>
            
            {session?.user?.isSubscribed && (
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
            
            {currentCredits <= 5 && currentCredits > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
                ⚠️ Low credits! Get more to continue chatting.
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Chat History */}
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Chat History</span>
              {loadingHistory && <Icons.spinner className="h-4 w-4 animate-spin" />}
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {chatHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No chat history yet</p>
                ) : (
                  chatHistory.map((chat) => (
                    <div key={chat.id} className="group relative">
                      <Button
                        variant={chatId === chat.id ? "secondary" : "ghost"}
                        className="w-full justify-start h-auto p-2 text-left pr-8"
                        onClick={() => loadChat(chat.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {chat.title || "New Chat"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteChat(chat.id)
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <Icons.user className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Chat Hub</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Powered by {selectedModel.name}</span>
                  <span>•</span>
                  <span>{session?.user?.isSubscribed ? "Unlimited" : `${selectedModel.creditsPerMessage} credit${selectedModel.creditsPerMessage > 1 ? 's' : ''}/msg`}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {currentCredits} {currentCredits === 1 ? 'credit' : 'credits'}
                </div>
                {session?.user?.isSubscribed && (
                  <Badge variant="default" className="text-xs">PRO</Badge>
                )}
              </div>
              <Badge 
                variant={hasEnoughCredits ? "outline" : "destructive"}
                className={cn(
                  "px-3 py-1",
                  !hasEnoughCredits && "animate-pulse"
                )}
              >
                {hasEnoughCredits ? "Ready" : "Low Credits"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <Icons.user className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Welcome to AI Chat Hub</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start a conversation with {selectedModel.name}. Ask questions, get help with coding, writing, or anything else.
                </p>
                <div className="grid gap-3 max-w-lg mx-auto">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                      💰 Credit System
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {selectedModel.name} costs {selectedModel.creditsPerMessage} credit{selectedModel.creditsPerMessage !== 1 ? 's' : ''} per message. You have {currentCredits} credits.
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                      🚀 Multiple AI Models
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Choose from GPT-3.5, GPT-4, Claude, Gemini Pro and more based on your needs.
                    </p>
                  </div>
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
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              code: ({ node, inline, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </div>
                                ) : (
                                  <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="mb-2 pl-4">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-2 pl-4">{children}</ol>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
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
            <form onSubmit={handleSubmit} className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${selectedModel.name}...`}
                disabled={isLoading}
                className="pr-12 py-3 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                {isLoading ? (
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.user className="h-4 w-4" />
                )}
              </Button>
            </form>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {session?.user?.isSubscribed 
                ? "Unlimited chats with Pro subscription"
                : `Using ${selectedModel.name} (${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} per message). ${currentCredits} credits remaining.`
              }
            </p>
            {currentCredits <= requiredCredits * 3 && currentCredits > 0 && (
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