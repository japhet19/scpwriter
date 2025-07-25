'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './TerminalDropdown.module.css'
import { ModelInfo, ModelCategory } from '@/config/models'

interface TerminalDropdownProps {
  categories: ModelCategory[]
  value: string
  onChange: (value: string) => void
  onModelSelect?: (model: ModelInfo) => void
}

export default function TerminalDropdown({ categories, value, onChange, onModelSelect }: TerminalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get all models as flat list for keyboard navigation
  const allModels = categories.flatMap(cat => 
    cat.models.filter(model => model.available !== false)
  )
  
  // Filter models based on search
  const filteredCategories = categories.map(cat => ({
    ...cat,
    models: cat.models.filter(model => 
      model.available !== false &&
      (model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       model.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(cat => cat.models.length > 0)

  // Find current selected model
  const selectedModel = allModels.find(model => model.id === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      // Expand category of current selection
      const currentCategory = categories.find(cat => 
        cat.models.some(model => model.id === value)
      )
      if (currentCategory) {
        setExpandedCategories(new Set([currentCategory.name]))
      }
    }
  }, [isOpen, value, categories])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    const visibleModels = filteredCategories.flatMap(cat => 
      expandedCategories.has(cat.name) ? cat.models : []
    )

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      
      case 'ArrowDown':
        e.preventDefault()
        if (visibleModels.length > 0) {
          setHighlightedIndex(prev => 
            prev < visibleModels.length - 1 ? prev + 1 : 0
          )
        }
        break
      
      case 'ArrowUp':
        e.preventDefault()
        if (visibleModels.length > 0) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : visibleModels.length - 1
          )
        }
        break
      
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < visibleModels.length) {
          const model = visibleModels[highlightedIndex]
          onChange(model.id)
          onModelSelect?.(model)
          setIsOpen(false)
        }
        break
    }
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  const selectModel = (model: ModelInfo) => {
    onChange(model.id)
    onModelSelect?.(model)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.selection}>
          {selectedModel ? (
            <>
              <span className={styles.modelName}>{selectedModel.name}</span>
              <span className={styles.modelCost}>{'💰'.repeat(selectedModel.costLevel)}</span>
              {selectedModel.recommended && <span className={styles.star}>⭐</span>}
            </>
          ) : (
            'SELECT MODEL'
          )}
        </span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.menu}>
          <div className={styles.menuHeader}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.search}
              placeholder="SEARCH MODELS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <div className={styles.menuContent}>
            {filteredCategories.map((category, catIndex) => {
              const isExpanded = expandedCategories.has(category.name)
              const categoryModels = category.models
              
              return (
                <div key={category.name} className={styles.category}>
                  <div 
                    className={styles.categoryHeader}
                    onClick={() => toggleCategory(category.name)}
                  >
                    <span className={styles.categoryArrow}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span className={styles.categoryName}>{category.name.toUpperCase()}</span>
                  </div>
                  
                  {isExpanded && (
                    <div className={styles.modelList}>
                      {categoryModels.map((model, modelIndex) => {
                        const globalIndex = filteredCategories
                          .slice(0, catIndex)
                          .reduce((acc, cat) => 
                            acc + (expandedCategories.has(cat.name) ? cat.models.length : 0), 
                            0
                          ) + modelIndex
                        
                        return (
                          <div
                            key={model.id}
                            className={`${styles.modelItem} ${
                              model.id === value ? styles.selected : ''
                            } ${
                              highlightedIndex === globalIndex ? styles.highlighted : ''
                            }`}
                            onClick={() => selectModel(model)}
                            onMouseEnter={() => setHighlightedIndex(globalIndex)}
                          >
                            <span className={styles.modelIndicator}>
                              {model.id === value ? '>' : '•'}
                            </span>
                            <span className={styles.modelName}>{model.name}</span>
                            <span className={styles.modelCost}>{'💰'.repeat(model.costLevel)}</span>
                            {model.recommended && <span className={styles.star}>⭐</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className={styles.menuFooter}>
            <span className={styles.hint}>↑↓ NAVIGATE • ENTER SELECT • ESC CLOSE</span>
          </div>
        </div>
      )}
    </div>
  )
}