'use client'

import { useEffect } from 'react'

// Supabaseがエラーをハッシュに付けてリダイレクトしてきた場合にURLをきれいにする
export default function ClearHashError() {
  useEffect(() => {
    if (window.location.hash.includes('error=')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  return null
}
