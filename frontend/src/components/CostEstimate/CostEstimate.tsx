'use client'

import React, { useState } from 'react'
import styles from './CostEstimate.module.css'
import { CostEstimate as CostEstimateType, formatCostEstimate, getCostLevelFromEstimate, getCostWarning } from '@/utils/costEstimator'

interface CostEstimateProps {
  estimate: CostEstimateType | null
  className?: string
}

export default function CostEstimate({ estimate, className }: CostEstimateProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [expandedExplanation, setExpandedExplanation] = useState(false)
  const [tooltipPersisted, setTooltipPersisted] = useState(false)
  
  if (!estimate) {
    return null
  }
  
  const costLevel = getCostLevelFromEstimate(estimate)
  const warning = getCostWarning(estimate)
  
  // Handle clicking outside to dismiss tooltip
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (tooltipPersisted && !target.closest(`.${styles.costEstimate}`)) {
        setTooltipPersisted(false)
        setShowTooltip(false)
        setExpandedExplanation(false)
      }
    }
    
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && tooltipPersisted) {
        setTooltipPersisted(false)
        setShowTooltip(false)
        setExpandedExplanation(false)
      }
    }
    
    if (tooltipPersisted) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [tooltipPersisted])
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedExplanation(!expandedExplanation)
    setTooltipPersisted(true)
  }
  
  return (
    <div className={`${styles.costEstimate} ${className || ''}`}>
      <div 
        className={styles.costDisplay}
        onMouseEnter={() => !tooltipPersisted && setShowTooltip(true)}
        onMouseLeave={() => !tooltipPersisted && setShowTooltip(false)}
        onClick={() => {
          setTooltipPersisted(true)
          setShowTooltip(true)
        }}
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
      
      {(showTooltip || tooltipPersisted) && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            <h4>
              Cost Breakdown 
              <button 
                className={styles.infoIcon}
                onClick={handleInfoClick}
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
            
            {expandedExplanation && (
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