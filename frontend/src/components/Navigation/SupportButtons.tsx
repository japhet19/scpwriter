'use client'

import React from 'react'
import styles from './SupportButtons.module.css'

export default function SupportButtons() {
  return (
    <div className={styles.supportButtons}>
      <a
        href="https://buymeacoffee.com/japhetkd"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.supportLink}
        aria-label="Support PlotCraft on Buy Me a Coffee"
        title="Support the creator"
      >
        <span className={styles.icon}>☕</span>
        <span className={styles.text}>Support</span>
      </a>
      <a
        href="https://forms.gle/b8TAsc8tuCj5ftF28"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.supportLink}
        aria-label="Send feedback about PlotCraft"
        title="Share your feedback"
      >
        <span className={styles.icon}>💬</span>
        <span className={styles.text}>Feedback</span>
      </a>
    </div>
  )
}