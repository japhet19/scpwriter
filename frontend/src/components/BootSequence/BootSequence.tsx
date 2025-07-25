'use client'

import React, { useState, useEffect } from 'react'
import styles from './BootSequence.module.css'
import { useTheme } from '@/contexts/ThemeContext'

interface BootSequenceProps {
  onComplete: () => void
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const { currentTheme } = useTheme()
  const [currentLine, setCurrentLine] = useState(0)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([])

  // Create boot messages from theme
  const bootMessages = currentTheme.ui.bootMessages.map((text, index) => ({
    text,
    delay: index * 400,
    progress: index === 1 // Show progress on second message
  }))

  useEffect(() => {
    if (currentLine < bootMessages.length) {
      const message = bootMessages[currentLine]
      const timer = setTimeout(() => {
        if (message.progress) {
          setShowProgress(true)
          // Animate progress bar
          let prog = 0
          const progInterval = setInterval(() => {
            prog += 10
            setProgress(prog)
            if (prog >= 100) {
              clearInterval(progInterval)
              setShowProgress(false)
              setDisplayedMessages(prev => [...prev, message.text + '[████████████] 100%'])
              setCurrentLine(currentLine + 1)
            }
          }, 50)
        } else {
          setDisplayedMessages(prev => [...prev, message.text])
          setCurrentLine(currentLine + 1)
        }
      }, message.delay)

      return () => clearTimeout(timer)
    } else {
      // Boot sequence complete
      setTimeout(onComplete, 500)
    }
  }, [currentLine, onComplete])

  return (
    <div className={styles.bootSequence}>
      <pre className={styles.asciiLogo}>
{currentTheme.id === 'scp' ? 
`   ███████╗ ██████╗██████╗ 
   ██╔════╝██╔════╝██╔══██╗
   ███████╗██║     ██████╔╝
   ╚════██║██║     ██╔═══╝ 
   ███████║╚██████╗██║     
   ╚══════╝ ╚═════╝╚═╝     
   SECURE. CONTAIN. PROTECT.` :
currentTheme.id === 'fantasy' ?
`   ✦･ﾟ: *✦･ﾟ:* 
   ENCHANTED
      TALES
   *:･ﾟ✦*:･ﾟ✦` :
currentTheme.id === 'cyberpunk' ?
`   ▐▓█▀▀▀▀▀▀▀▀▀█▓▌
   ▐▓█ NEURAL █▓▌
   ▐▓█ NETWORK █▓▌
   ▐▓█▄▄▄▄▄▄▄▄▄█▓▌` :
`   ${currentTheme.name.toUpperCase()}
   ${currentTheme.ui.tagline}`
}
      </pre>
      <div className={styles.bootMessages}>
        {displayedMessages.map((msg, idx) => (
          <div key={idx} className={styles.bootLine}>
            {'>'} {msg}
          </div>
        ))}
        {showProgress && (
          <div className={styles.progressContainer}>
            {'>'} LOADING KERNEL... [
            <span className={styles.progressBar}>
              {'█'.repeat(Math.floor(progress / 10))}
              {'░'.repeat(10 - Math.floor(progress / 10))}
            </span>
            ] {progress}%
          </div>
        )}
        <span className="cursor" />
      </div>
    </div>
  )
}