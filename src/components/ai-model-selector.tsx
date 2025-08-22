"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { aiModels, AIModel } from "@/lib/ai-models"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface AIModelSelectorProps {
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
  disabled?: boolean
}

export function AIModelSelector({ selectedModel, onModelChange, disabled = false }: AIModelSelectorProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const getCreditsDisplay = (model: AIModel) => {
    if (session?.user?.isSubscribed) {
      return <Badge variant="default">Free</Badge>
    }
    return (
      <Badge variant={model.creditsPerMessage === 1 ? "secondary" : "outline"}>
        {model.creditsPerMessage} credit{model.creditsPerMessage !== 1 ? 's' : ''}
      </Badge>
    )
  }

  const getModelColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200"
    }
    return colorMap[color] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const canAffordModel = (model: AIModel) => {
    return session?.user?.isSubscribed || (session?.user?.credits || 0) >= model.creditsPerMessage
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start h-auto p-3"
          disabled={disabled}
        >
          <div className="flex items-center space-x-3 w-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn(
                "text-sm font-medium",
                getModelColorClass(selectedModel.color)
              )}>
                {selectedModel.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <div className="font-medium">{selectedModel.name}</div>
              <div className="text-xs text-muted-foreground">
                {selectedModel.description}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getCreditsDisplay(selectedModel)}
              <Icons.user className="h-4 w-4 opacity-50" />
            </div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icons.user className="h-5 w-5" />
            <span>Choose AI Model</span>
          </DialogTitle>
          <DialogDescription>
            Select an AI model for your conversation. Different models have varying capabilities and credit costs.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Basic Models */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Basic Models</h4>
              <div className="space-y-2">
                {aiModels.filter(m => m.category === "basic").map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel.id === model.id}
                    onSelect={() => {
                      onModelChange(model)
                      setOpen(false)
                    }}
                    canAfford={canAffordModel(model)}
                    isSubscribed={!!session?.user?.isSubscribed}
                    userCredits={session?.user?.credits || 0}
                  />
                ))}
              </div>
            </div>

            {/* Advanced Models */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Advanced Models</h4>
              <div className="space-y-2">
                {aiModels.filter(m => m.category === "advanced").map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel.id === model.id}
                    onSelect={() => {
                      onModelChange(model)
                      setOpen(false)
                    }}
                    canAfford={canAffordModel(model)}
                    isSubscribed={!!session?.user?.isSubscribed}
                    userCredits={session?.user?.credits || 0}
                  />
                ))}
              </div>
            </div>

            {/* Premium Models */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Premium Models</h4>
              <div className="space-y-2">
                {aiModels.filter(m => m.category === "premium").map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel.id === model.id}
                    onSelect={() => {
                      onModelChange(model)
                      setOpen(false)
                    }}
                    canAfford={canAffordModel(model)}
                    isSubscribed={!!session?.user?.isSubscribed}
                    userCredits={session?.user?.credits || 0}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Credits Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Your credits:</span>
            <Badge variant={session?.user?.credits > 10 ? "secondary" : "destructive"}>
              {session?.user?.credits || 0} {session?.user?.isSubscribed ? "(Unlimited with PRO)" : ""}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ModelCardProps {
  model: AIModel
  isSelected: boolean
  onSelect: () => void
  canAfford: boolean
  isSubscribed: boolean
  userCredits: number
}

function ModelCard({ model, isSelected, onSelect, canAfford, isSubscribed, userCredits }: ModelCardProps) {
  const getModelColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200"
    }
    return colorMap[color] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary border-primary" : ""
      } ${!canAfford ? "opacity-60" : ""}`}
      onClick={canAfford ? onSelect : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn(
                "text-sm font-medium",
                getModelColorClass(model.color)
              )}>
                {model.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm flex items-center space-x-2">
                <span>{model.name}</span>
                {model.popular && (
                  <Badge variant="default" className="text-xs">
                    Popular
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {model.description}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={isSubscribed ? "secondary" : canAfford ? "outline" : "destructive"}
              className="text-xs"
            >
              {isSubscribed ? "Free" : `${model.creditsPerMessage} credits`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {model.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {model.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{model.features.length - 3} more
              </Badge>
            )}
          </div>
          
          {!canAfford && !isSubscribed && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              <Icons.user className="h-3 w-3 inline mr-1" />
              Insufficient credits (need {model.creditsPerMessage})
            </div>
          )}
          
          {isSelected && (
            <div className="text-xs text-primary bg-primary/10 p-2 rounded">
              <Icons.user className="h-3 w-3 inline mr-1" />
              Currently selected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}