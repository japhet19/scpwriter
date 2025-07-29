'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './UserMenu.module.css'

interface UserMenuProps {
  onClose: () => void
  username: string
}

export default function UserMenu({ onClose, username }: UserMenuProps) {
  const { signOut, hasOpenRouterKey, unlinkOpenRouter } = useAuth()
  const router = useRouter()
  const [isUnlinking, setIsUnlinking] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    onClose()
    router.push('/signin')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose()
  }

  const handleUnlinkOpenRouter = async () => {
    if (isUnlinking) return
    
    setIsUnlinking(true)
    try {
      await unlinkOpenRouter()
      onClose()
    } catch (error) {
      console.error('Failed to unlink OpenRouter:', error)
      alert('Failed to unlink OpenRouter account. Please try again.')
    } finally {
      setIsUnlinking(false)
    }
  }

  return (
    <div className={styles.dropdown} role="menu">
      <div className={styles.dropdownHeader}>
        <span className={styles.terminalPrompt}>&gt;</span>
        <span className={styles.username}>{username}@plotcraft</span>
      </div>
      
      <div className={styles.dropdownDivider} />
      
      {hasOpenRouterKey && (
        <>
          <button
            onClick={handleUnlinkOpenRouter}
            className={styles.dropdownItem}
            role="menuitem"
            disabled={isUnlinking}
          >
            <span className={styles.itemIcon}>&gt;</span>
            {isUnlinking ? 'Unlinking...' : 'Unlink OpenRouter'}
          </button>
          <div className={styles.dropdownDivider} />
        </>
      )}
      
      <button
        onClick={handleSignOut}
        className={`${styles.dropdownItem} ${styles.signOut}`}
        role="menuitem"
      >
        <span className={styles.itemIcon}>&gt;</span>
        Sign Out
      </button>
      
      <div className={styles.dropdownFooter}>
        <span className={styles.statusIndicator}>●</span>
        <span className={styles.statusText}>CONNECTED</span>
      </div>
    </div>
  )
}