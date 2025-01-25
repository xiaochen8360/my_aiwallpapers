"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemesProviderProps } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: NextThemesProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // 使用 useEffect 来避免服务端渲染时的主题闪烁
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
