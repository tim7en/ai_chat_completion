export interface AIModel {
  id: string
  name: string
  description: string
  creditsPerMessage: number
  maxTokens: number
  features: string[]
  category: "basic" | "advanced" | "premium"
  popular?: boolean
  color: string
}

export const aiModels: AIModel[] = [
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and efficient for everyday tasks",
    creditsPerMessage: 1,
    maxTokens: 4096,
    features: [
      "Quick responses",
      "General knowledge",
      "Code assistance",
      "Text generation"
    ],
    category: "basic",
    color: "blue"
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "More powerful and creative",
    creditsPerMessage: 3,
    maxTokens: 8192,
    features: [
      "Advanced reasoning",
      "Creative writing",
      "Complex problem solving",
      "Better context understanding"
    ],
    category: "advanced",
    popular: true,
    color: "purple"
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Latest GPT-4 with enhanced capabilities",
    creditsPerMessage: 4,
    maxTokens: 128000,
    features: [
      "Large context window",
      "Improved accuracy",
      "Latest knowledge cutoff",
      "Multimodal capabilities"
    ],
    category: "advanced",
    color: "indigo"
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Anthropic's most capable model",
    creditsPerMessage: 5,
    maxTokens: 200000,
    features: [
      "Exceptional reasoning",
      "Long context understanding",
      "Reduced hallucinations",
      "Helpful and harmless"
    ],
    category: "premium",
    color: "orange"
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    description: "Balance of speed and intelligence",
    creditsPerMessage: 2,
    maxTokens: 100000,
    features: [
      "Fast responses",
      "Good reasoning",
      "Cost-effective",
      "Reliable performance"
    ],
    category: "advanced",
    color: "yellow"
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    description: "Google's advanced multimodal model",
    creditsPerMessage: 2,
    maxTokens: 32768,
    features: [
      "Multimodal understanding",
      "Google search integration",
      "Code generation",
      "Multilingual support"
    ],
    category: "advanced",
    color: "green"
  }
]

export function getModelById(id: string): AIModel | undefined {
  return aiModels.find(model => model.id === id)
}

export function getModelsByCategory(category: AIModel["category"]): AIModel[] {
  return aiModels.filter(model => model.category === category)
}

export function getPopularModels(): AIModel[] {
  return aiModels.filter(model => model.popular)
}