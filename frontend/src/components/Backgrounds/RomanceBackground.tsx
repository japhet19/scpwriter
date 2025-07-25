'use client'

import React, { useEffect, useState } from 'react'
import styles from './Backgrounds.module.css'

export default function RomanceBackground() {
  const [hearts, setHearts] = useState<Array<{id: number, left: number, delay: number}>>([])
  
  useEffect(() => {
    const newHearts = []
    for (let i = 0; i < 10; i++) {
      newHearts.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10
      })
    }
    setHearts(newHearts)
  }, [])
  
  return (
    <div className={styles.backgroundContainer}>
      {hearts.map(heart => (
        <span
          key={heart.id}
          className={styles.heart}
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`
          }}
        >
          ♥
        </span>
      ))}
    </div>
  )
}