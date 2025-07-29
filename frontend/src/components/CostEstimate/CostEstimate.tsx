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
  
  if (!estimate) {
    return null
  }
  
  const costLevel = getCostLevelFromEstimate(estimate)
  const warning = getCostWarning(estimate)
  
  return (
    <div className={`${styles.costEstimate} ${className || ''}`}>
      <div 
        className={styles.costDisplay}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
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
      
      {showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            <h4>Cost Breakdown</h4>
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
          </div>
        </div>
      )}
    </div>
  )
}