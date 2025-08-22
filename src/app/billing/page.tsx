"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/ui/icons"
import { Separator } from "@/components/ui/separator"
import { aiModels, AIModel } from "@/lib/ai-models"
import { toast } from "sonner"

interface PricingPlan {
  id: string
  name: string
  price: number
  credits: number
  features: string[]
  popular?: boolean
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    credits: 100,
    features: [
      "100 AI chat credits",
      "Basic AI models",
      "Email support",
      "7-day history"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    credits: 500,
    features: [
      "500 AI chat credits",
      "Advanced AI models",
      "Priority support",
      "30-day history",
      "Custom instructions"
    ],
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99.99,
    credits: 2000,
    features: [
      "2000 AI chat credits",
      "All AI models",
      "24/7 phone support",
      "Unlimited history",
      "API access",
      "Custom integrations"
    ]
  }
]

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const handlePurchase = async (plan: PricingPlan) => {
    if (!session) {
      toast.error("Please sign in to purchase credits")
      return
    }

    setIsLoading(plan.id)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const response = await fetch("/api/billing/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price,
          credits: plan.credits
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process payment")
      }

      const data = await response.json()
      
      toast.success(`Successfully purchased ${plan.credits} credits!`)
      
      // Reload the page to update session
      router.refresh()
      
    } catch (error) {
      toast.error("Failed to process payment. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  const handleSubscribe = async () => {
    if (!session) {
      toast.error("Please sign in to subscribe")
      return
    }

    setIsLoading("pro")
    
    try {
      // Simulate subscription processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "pro_monthly",
          amount: 29.99
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process subscription")
      }

      toast.success("Successfully subscribed to Pro plan!")
      
      // Reload the page to update session
      router.refresh()
      
    } catch (error) {
      toast.error("Failed to process subscription. Please try again.")
    } finally {
      setIsLoading(null)
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
          <p className="text-muted-foreground mt-2">
            Choose the perfect plan for your AI chat needs
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Credits Balance</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {session.user.credits} credits
                  </Badge>
                  {session.user.isSubscribed && (
                    <Badge variant="default">PRO Subscriber</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {session.user.isSubscribed 
                    ? "Unlimited chats with Pro subscription"
                    : "Each chat consumes 1 credit"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Packs */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Credit Packs</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="text-3xl font-bold">
                      ${plan.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      one-time payment
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Icons.user className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handlePurchase(plan)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Purchase ${plan.credits} Credits`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Model Pricing */}
        <div>
          <h2 className="text-2xl font-bold mb-6">AI Model Pricing</h2>
          <div className="bg-muted/50 p-6 rounded-lg mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Icons.user className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">How Credits Work</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Each AI model consumes a different number of credits per message. Choose the model that best fits your needs and budget.
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-background p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">Basic Models</div>
                <div className="text-xs text-muted-foreground">1 credit per message</div>
              </div>
              <div className="bg-background p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">Advanced Models</div>
                <div className="text-xs text-muted-foreground">2-4 credits per message</div>
              </div>
              <div className="bg-background p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">Premium Models</div>
                <div className="text-xs text-muted-foreground">5 credits per message</div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiModels.map((model) => (
              <Card key={model.id} className={`relative ${model.popular ? 'border-primary shadow-lg' : ''}`}>
                {model.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-lg flex items-center justify-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-${model.color}-500`}></div>
                    <span>{model.name}</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {model.description}
                  </CardDescription>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-sm">
                      {model.creditsPerMessage} credit{model.creditsPerMessage !== 1 ? 's' : ''} per message
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Features:</div>
                    <ul className="space-y-1">
                      {model.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-xs">
                          <Icons.user className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Max Tokens:</div>
                    <div className="text-xs">{model.maxTokens.toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-xs font-medium mb-1">Cost Estimate:</div>
                    <div className="text-xs text-muted-foreground">
                      {session.user.isSubscribed ? (
                        <span className="text-green-600 font-medium">FREE with Pro</span>
                      ) : (
                        <span>
                          10 messages = {model.creditsPerMessage * 10} credits<br />
                          50 messages = {model.creditsPerMessage * 50} credits
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription */}
        {!session.user.isSubscribed && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Pro Subscription</span>
                <Badge variant="default">RECOMMENDED</Badge>
              </CardTitle>
              <CardDescription>
                Unlimited AI conversations and premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">What you get:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <Icons.user className="h-4 w-4 text-green-500" />
                      <span>Unlimited AI chats</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Icons.user className="h-4 w-4 text-green-500" />
                      <span>Access to all AI models</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Icons.user className="h-4 w-4 text-green-500" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Icons.user className="h-4 w-4 text-green-500" />
                      <span>Advanced features</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold">$29.99</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleSubscribe}
                    disabled={isLoading === "pro"}
                  >
                    {isLoading === "pro" ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Subscribe to Pro"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}