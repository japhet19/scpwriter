export interface ModelInfo {
  id: string
  name: string
  provider: string
  description: string
  contextLength?: number
  costLevel: 1 | 2 | 3 // 1 = low cost (💰), 2 = medium (💰💰), 3 = high (💰💰💰)
  recommended?: boolean
  available?: boolean
}

export interface ModelCategory {
  name: string
  description: string
  models: ModelInfo[]
}

export const MODEL_CATEGORIES: ModelCategory[] = [
  {
    name: "Premium (Recommended)",
    description: "Top-tier models for the best creative writing quality",
    models: [
      {
        id: "anthropic/claude-opus-4-20250514",
        name: "Claude 4 Opus",
        provider: "Anthropic",
        description: "Most powerful Claude model - exceptional creative writing",
        contextLength: 200000,
        costLevel: 3,
        recommended: true,
        available: true
      },
      {
        id: "anthropic/claude-sonnet-4-20250514",
        name: "Claude 4 Sonnet",
        provider: "Anthropic",
        description: "Balanced performance and cost - excellent for stories",
        contextLength: 200000,
        costLevel: 3,
        recommended: true,
        available: true
      },
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        description: "Previous generation - still excellent for creative tasks",
        contextLength: 200000,
        costLevel: 2,
        available: true
      },
      {
        id: "anthropic/claude-3-opus-20240229",
        name: "Claude 3 Opus",
        provider: "Anthropic",
        description: "Powerful model with strong reasoning capabilities",
        contextLength: 200000,
        costLevel: 2,
        available: true
      }
    ]
  },
  {
    name: "High Performance",
    description: "Advanced models with strong capabilities",
    models: [
      {
        id: "openai/gpt-4.1",
        name: "GPT-4.1",
        provider: "OpenAI",
        description: "Latest GPT-4 iteration with improved performance",
        contextLength: 1000000,
        costLevel: 2,
        available: true
      },
      {
        id: "openai/gpt-4o",
        name: "GPT-4o",
        provider: "OpenAI",
        description: "Optimized GPT-4 for faster responses",
        contextLength: 128000,
        costLevel: 2,
        available: true
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        description: "Smaller, faster version of GPT-4o",
        contextLength: 128000,
        costLevel: 1,
        available: true
      },
      {
        id: "openai/gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "OpenAI",
        description: "Fast GPT-4 with vision capabilities",
        contextLength: 128000,
        costLevel: 2,
        available: true
      },
      {
        id: "openai/o4-mini",
        name: "O4 Mini",
        provider: "OpenAI",
        description: "Fast reasoning model with multimodal support",
        contextLength: 200000,
        costLevel: 2,
        available: true
      },
      {
        id: "openai/o1-preview",
        name: "O1 Preview",
        provider: "OpenAI",
        description: "Preview of reasoning model",
        contextLength: 200000,
        costLevel: 3,
        available: false // May not be available yet
      },
      {
        id: "openai/o1-mini",
        name: "O1 Mini",
        provider: "OpenAI",
        description: "Smaller O1 model",
        contextLength: 200000,
        costLevel: 2,
        available: false // May not be available yet
      }
    ]
  },
  {
    name: "Google Models",
    description: "Google's Gemini family of models",
    models: [
      {
        id: "google/gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        provider: "Google",
        description: "Most capable Gemini model with massive context",
        contextLength: 1000000,
        costLevel: 2,
        available: true
      },
      {
        id: "google/gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        provider: "Google",
        description: "Fast and cost-effective - great for creative writing",
        contextLength: 1000000,
        costLevel: 1,
        recommended: true,
        available: true
      },
      {
        id: "google/gemini-pro-1.5",
        name: "Gemini Pro 1.5",
        provider: "Google",
        description: "Previous generation Gemini Pro",
        contextLength: 1000000,
        costLevel: 1,
        available: true
      }
    ]
  },
  {
    name: "Cost-Effective",
    description: "Budget-friendly options that still deliver quality",
    models: [
      {
        id: "openai/gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "OpenAI",
        description: "Fast and affordable, good for simpler tasks",
        contextLength: 16385,
        costLevel: 1,
        available: true
      },
      {
        id: "meta-llama/llama-3.1-70b-instruct",
        name: "Llama 3.1 70B",
        provider: "Meta",
        description: "Open-source model with strong performance",
        contextLength: 128000,
        costLevel: 1,
        available: true
      },
      {
        id: "mistralai/mistral-large",
        name: "Mistral Large",
        provider: "Mistral AI",
        description: "Competitive open model",
        contextLength: 32000,
        costLevel: 1,
        available: true
      }
    ]
  }
]

// Default model - Gemini 2.5 Flash for cost-effectiveness
export const DEFAULT_MODEL = "google/gemini-2.5-flash"

// Get all available models as a flat list
export const getAllModels = (): ModelInfo[] => {
  return MODEL_CATEGORIES.flatMap(category => category.models)
}

// Get model info by ID
export const getModelById = (modelId: string): ModelInfo | undefined => {
  return getAllModels().find(model => model.id === modelId)
}

// Get cost indicator string
export const getCostIndicator = (costLevel: 1 | 2 | 3): string => {
  return '💰'.repeat(costLevel)
}