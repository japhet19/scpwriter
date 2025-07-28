'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './UserMenu.module.css'

interface UserMenuProps {
  onClose: () => void
  username: string
}

export default function UserMenu({ onClose, username }: UserMenuProps) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    onClose()
    router.push('/signin')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose()
  }

  return (
    <div className={styles.dropdown} role="menu">
      <div className={styles.dropdownHeader}>
        <span className={styles.terminalPrompt}>&gt;</span>
        <span className={styles.username}>{username}@plotcraft</span>
      </div>
      
      <div className={styles.dropdownDivider} />
      
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