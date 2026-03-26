// components/real-time-sync.tsx
"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"

export function RealTimeSync() {
  const sync = useStore((state) => state.sync)

  useEffect(() => {
    sync()
    const interval = setInterval(() => {
      sync()
    }, 3000)
    return () => clearInterval(interval)
  }, [sync])

  return null
}