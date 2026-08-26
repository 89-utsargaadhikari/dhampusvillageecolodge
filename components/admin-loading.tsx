"use client"

import { useCallback, useRef, useState } from "react"
import { Spinner } from "@/components/ui/spinner"

export function AdminLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[16rem] items-center justify-center" role="status" aria-live="polite">
      <div className="text-center space-y-3">
        <Spinner className="mx-auto size-8 text-primary" />
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  )
}

export function AdminRefreshHint({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Spinner className="size-3.5" />
      Updating
    </span>
  )
}

export function useAdminLoader() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const loaded = useRef(false)

  const run = useCallback(async <T,>(fn: () => Promise<T>) => {
    if (!loaded.current) setLoading(true)
    else setRefreshing(true)
    try {
      return await fn()
    } finally {
      loaded.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  return { loading, refreshing, run }
}
