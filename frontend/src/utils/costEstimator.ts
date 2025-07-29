import { ModelInfo } from '@/config/models'

export interface CostEstimate {
  lowEstimate: number
  highEstimate: number
  baseTokens: number
  inputTokens: number
  outputTokens: number
}

/**
 * Estimates the cost of generating a story based on model and page count
 * 
 * Based on analysis of actual token usage:
 * - Multi-agent system generates 8-10x more tokens than just the final story
 * - Agents read context multiple times (5x multiplier for input)
 * - Extensive feedback and discussion (8x multiplier for output)
 */
export function estimateStoryCost(model: ModelInfo, pages: number): CostEstimate | null {
  // Check if model has pricing info
  if (!model.inputCostPerMillion || !model.outputCostPerMillion) {
    return null
  }

  // Base calculation: ~300 words per page, ~1.3 tokens per word
  const baseTokens = pages * 300 * 1.3
  
  // Multi-agent system multipliers based on actual usage data
  const inputTokens = baseTokens * 5   // Agents read growing context multiple times
  const outputTokens = baseTokens * 8  // Story + extensive feedback/discussion
  
  // Calculate costs in USD
  const inputCost = (inputTokens * model.inputCostPerMillion) / 1_000_000
  const outputCost = (outputTokens * model.outputCostPerMillion) / 1_000_000
  const baseCost = inputCost + outputCost
  
  // Add 20% buffer for variations
  const lowEstimate = baseCost * 0.8
  const highEstimate = baseCost * 1.2
  
  return {
    lowEstimate,
    highEstimate,
    baseTokens: Math.round(baseTokens),
    inputTokens: Math.round(inputTokens),
    outputTokens: Math.round(outputTokens)
  }
}

/**
 * Format cost estimate for display
 */
export function formatCostEstimate(estimate: CostEstimate | null): string {
  if (!estimate) {
    return 'Cost estimate unavailable'
  }
  
  // Format with appropriate precision based on cost magnitude
  if (estimate.highEstimate < 0.10) {
    return `$${estimate.lowEstimate.toFixed(3)} - $${estimate.highEstimate.toFixed(3)}`
  } else if (estimate.highEstimate < 1.00) {
    return `$${estimate.lowEstimate.toFixed(2)} - $${estimate.highEstimate.toFixed(2)}`
  } else {
    return `$${estimate.lowEstimate.toFixed(2)} - $${estimate.highEstimate.toFixed(2)}`
  }
}

/**
 * Get cost level indicator (💰 symbols) based on estimated cost
 */
export function getCostLevelFromEstimate(estimate: CostEstimate | null): string {
  if (!estimate) return ''
  
  const avgCost = (estimate.lowEstimate + estimate.highEstimate) / 2
  
  if (avgCost < 0.05) return '💰'
  if (avgCost < 0.25) return '💰💰'
  return '💰💰💰'
}

/**
 * Get warning message for high cost estimates
 */
export function getCostWarning(estimate: CostEstimate | null): string | null {
  if (!estimate) return null
  
  const avgCost = (estimate.lowEstimate + estimate.highEstimate) / 2
  
  if (avgCost > 1.00) {
    return 'This configuration will be expensive. Consider using a more cost-effective model.'
  } else if (avgCost > 0.50) {
    return 'This configuration has moderate cost. Consider fewer pages or a cheaper model to save.'
  }
  
  return null
}