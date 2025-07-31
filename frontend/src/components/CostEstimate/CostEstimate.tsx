'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './CostEstimate.module.css'
import { CostEstimate as CostEstimateType, formatCostEstimate, getCostLevelFromEstimate, getCostWarning } from '@/utils/costEstimator'

interface CostEstimateProps {
  estimate: CostEstimateType | null
  className?: string
}

interface TooltipState {
  showTooltip: boolean
  expandedExplanation: boolean
  tooltipPersisted: boolean
}

export default function CostEstimate({ estimate, className }: CostEstimateProps) {
  // Always initialize hooks in the same order - no early returns
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    showTooltip: false,
    expandedExplanation: false,
    tooltipPersisted: false
  })
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Safe computation - only calculate if estimate exists
  const costLevel = estimate ? getCostLevelFromEstimate(estimate) : ''
  const warning = estimate ? getCostWarning(estimate) : null
  
  // Simple event handlers without useCallback to avoid hook violations
  const closeTooltip = () => {
    setTooltipState({
      showTooltip: false,
      expandedExplanation: false,
      tooltipPersisted: false
    })
  }
  
  const showTooltipPersisted = () => {
    setTooltipState(prev => ({
      ...prev,
      showTooltip: true,
      tooltipPersisted: true
    }))
  }
  
  const toggleExplanation = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTooltipState(prev => ({
      ...prev,
      expandedExplanation: !prev.expandedExplanation,
      tooltipPersisted: true
    }))
  }
  
  // Handle outside clicks and escape key
  useEffect(() => {
    if (typeof document === 'undefined' || !tooltipState.tooltipPersisted) {
      return
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeTooltip()
      }
    }
    
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTooltip()
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscKey)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [tooltipState.tooltipPersisted])
  
  // Always render consistent structure - handle null estimate with conditional content
  if (!estimate) {
    return <div className={`${styles.costEstimate} ${className || ''}`} style={{ display: 'none' }} />
  }

  return (
    <div className={`${styles.costEstimate} ${className || ''}`} ref={containerRef}>
      <div 
        className={styles.costDisplay}
        onMouseEnter={() => !tooltipState.tooltipPersisted && setTooltipState(prev => ({ ...prev, showTooltip: true }))}
        onMouseLeave={() => !tooltipState.tooltipPersisted && setTooltipState(prev => ({ ...prev, showTooltip: false }))}
        onClick={showTooltipPersisted}
      >
        <span className={styles.label}>Estimated Cost:</span>
        <span className={styles.amount}>{formatCostEstimate(estimate)}</span>
        <span className={styles.costLevel}>{costLevel}</span>
      </div>
      
      {warning && (
        <div className={styles.warning}>
          ⚠️ {warning}
        </div>
      )}
      
      {(tooltipState.showTooltip || tooltipState.tooltipPersisted) && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            <h4>
              Cost Breakdown 
              <button 
                className={styles.infoIcon}
                onClick={toggleExplanation}
                aria-label="Toggle algorithm explanation"
                title="Why these multipliers?"
              >
                [?]
              </button>
            </h4>
            <div className={styles.breakdown}>
              <div className={styles.breakdownRow}>
                <span>Base tokens:</span>
                <span>{estimate.baseTokens.toLocaleString()}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Input tokens (5x):</span>
                <span>{estimate.inputTokens.toLocaleString()}</span>
              </div>
              <div className={styles.breakdownRow}>
                <span>Output tokens (8x):</span>
                <span>{estimate.outputTokens.toLocaleString()}</span>
              </div>
            </div>
            <div className={styles.note}>
              * Multi-agent system generates extensive feedback and discussion
            </div>
            
            {tooltipState.expandedExplanation && (
              <div className={styles.explanation}>
                <div className={styles.explanationHeader}>▼ Why these multipliers?</div>
                <div className={styles.explanationContent}>
                  <p>Our story generation uses 3 specialized agents that collaborate through multiple revision cycles:</p>
                  
                  <ul>
                    <li>• <strong>Writer</strong> creates initial drafts and revisions</li>
                    <li>• <strong>Reader</strong> provides detailed feedback and quality checks</li>
                    <li>• <strong>Expert</strong> arbitrates and ensures technical accuracy</li>
                  </ul>
                  
                  <p className={styles.tokenExplanation}>Token usage multipliers:</p>
                  <ul>
                    <li>• <strong>5x input:</strong> Each agent receives the full growing context</li>
                    <li>• <strong>8x output:</strong> Agents generate detailed feedback, multiple drafts, and collaborative discussions</li>
                  </ul>
                  
                  <p className={styles.reassurance}>This ensures accurate cost estimates for the entire multi-agent generation process.</p>
                </div>
                <div className={styles.explanationFooter}>└─────────────────────────────────────────────────</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}