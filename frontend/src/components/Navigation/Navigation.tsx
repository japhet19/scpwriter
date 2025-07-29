'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './Navigation.module.css'
import UserMenu from './UserMenu'

export default function Navigation() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [router])

  const handleLogoClick = () => {
    // Navigate to home with a query parameter to show theme selection
    router.push('/?selectTheme=true')
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const getUserDisplayName = () => {
    if (!user) return 'guest'
    if (user.user_metadata?.username) return user.user_metadata.username
    if (user.email) return user.email.split('@')[0]
    return 'user'
  }

  return (
    <nav className={styles.navContainer} role="navigation" aria-label="Main navigation">
      <div className={styles.navContent}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <button 
            onClick={handleLogoClick}
            className={styles.logoButton}
            aria-label="PlotCraft Home"
          >
            <span className={styles.logoIcon}>[&gt;_]</span>
            <span className={styles.logoText}>PlotCraft</span>
          </button>
        </div>

        {/* Desktop User Section */}
        <div className={styles.userSection}>
          {loading ? (
            <span className={styles.loadingText}>AUTHENTICATING...</span>
          ) : user ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                onClick={toggleUserMenu}
                className={styles.userButton}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span className={styles.username}>[{getUserDisplayName()}@plotcraft]</span>
                <span className={styles.dropdownIcon}>▼</span>
              </button>
              {isUserMenuOpen && (
                <UserMenu 
                  onClose={() => setIsUserMenuOpen(false)}
                  username={getUserDisplayName()}
                />
              )}
            </div>
          ) : null}
        </div>

        {/* Mobile Menu Button - Only show when user is authenticated */}
        {user && (
          <button
            onClick={toggleMobileMenu}
            className={styles.mobileMenuButton}
            aria-label="Mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            ☰
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && user && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileUserInfo}>
            [{getUserDisplayName()}@plotcraft]
          </div>
          <div className={styles.mobileDivider}>━━━━━━━━━━━━━━━</div>
          <button 
            onClick={async () => {
              await signOut()
              router.push('/signin')
            }}
            className={styles.mobileMenuItem}
          >
            &gt; Sign Out
          </button>
        </div>
      )}

      <div className={styles.navBorder} />
    </nav>
  )
}