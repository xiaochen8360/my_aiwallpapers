'use client'

import { useState, useEffect, useRef } from 'react'
import { AuthenticationClient } from 'authing-js-sdk'
import { Button } from "@/components/ui/button"
import { Sun, Moon, LogIn, LogOut, User, QrCode } from 'lucide-react'
import { useTheme } from 'next-themes'
import { create } from 'zustand'

interface AuthStore {
    user: any;
    showQRCode: boolean;
    qrCodeUrl: string;
    scanStatus: 'PENDING' | 'SCANNED' | 'CONFIRMED';
    setUser: (user: any) => void;
    setShowQRCode: (show: boolean) => void;
    setQRCodeUrl: (url: string) => void;
    setScanStatus: (status: 'PENDING' | 'SCANNED' | 'CONFIRMED') => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    showQRCode: false,
    qrCodeUrl: '',
    scanStatus: 'PENDING',
    setUser: (user) => set({ user }),
    setShowQRCode: (show) => set({ showQRCode: show }),
    setQRCodeUrl: (url) => set({ qrCodeUrl: url }),
    setScanStatus: (status) => set({ scanStatus: status }),
}))

const authenticationClient = new AuthenticationClient({
    appId: process.env.NEXT_PUBLIC_AUTHING_APP_ID || '6794be33dd3341640b28176f',
    secret: process.env.NEXT_PUBLIC_AUTHING_APP_SECRET || '198ce99eff3dbb8ccc24486bf5e9b534',
    appHost: 'https://srcrw3rgweam-demo.authing.cn',
    redirectUri: 'http://localhost:3000/api/auth/callback',
})

export async function handleLogin() {
    try {
        // 获取二维码登录链接
        const { url, random } = await authenticationClient.qrcode.geneCode()
        useAuthStore.getState().setQRCodeUrl(url)
        useAuthStore.getState().setShowQRCode(true)
        useAuthStore.getState().setScanStatus('PENDING')

        // 开始轮询扫码状态
        const intervalId = setInterval(async () => {
            try {
                const { status, ticket } = await authenticationClient.qrcode.checkStatus(random)
                const statusMap: Record<number, 'PENDING' | 'SCANNED' | 'CONFIRMED'> = {
                    0: 'PENDING',  // used
                    1: 'SCANNED',  // scanned
                    2: 'CONFIRMED', // authorized
                    3: 'PENDING',   // canceled
                    [-1]: 'PENDING' // expired
                }
                const mappedStatus = statusMap[status] || 'PENDING'
                useAuthStore.getState().setScanStatus(mappedStatus)
                
                if (status === 2) { // authorized
                    clearInterval(intervalId)
                    if (ticket) {
                        const user = await authenticationClient.qrcode.exchangeUserInfo(ticket)
                        useAuthStore.getState().setUser(user)
                        useAuthStore.getState().setShowQRCode(false)
                    }
                }
            } catch (error) {
                console.error('Error checking QR code status:', error)
                clearInterval(intervalId)
            }
        }, 1500)
    } catch (error) {
        console.error('Error during login:', error)
    }
}

export async function handleLogout() {
    try {
        await authenticationClient.logout()
        useAuthStore.getState().setUser(null)
    } catch (error) {
        console.error('Error logging out:', error)
    }
}

export function QRCodeDialog() {
    const { showQRCode, qrCodeUrl, scanStatus, setShowQRCode } = useAuthStore()

    if (!showQRCode || !qrCodeUrl) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowQRCode(false)}>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background p-8 rounded-2xl shadow-2xl dark:border border-border w-[400px]" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-6 text-center">请使用手机扫码登录</h3>
                <div className="flex justify-center">
                    <img src={qrCodeUrl} alt="登录二维码" className="w-64 h-64" />
                </div>
                <p className="text-sm text-muted-foreground mt-6 text-center">
                    {scanStatus === 'SCANNED' ? '已扫码，请在手机上确认' : '扫描二维码完成登录'}
                </p>
            </div>
        </div>
    )
}

export function Header() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const { user } = useAuthStore()

    useEffect(() => {
        setMounted(true)
        // Check if user is already logged in
        const checkLoginStatus = async () => {
            try {
                const currentUser = await authenticationClient.getCurrentUser()
                if (currentUser) {
                    useAuthStore.getState().setUser(currentUser)
                }
            } catch (error) {
                console.error('Error checking login status:', error)
            }
        }
        checkLoginStatus()
    }, [])

    if (!mounted) return null

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">AI壁纸生成器</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <span>{user.name || user.email}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="flex items-center gap-1"
                            >
                                <LogOut className="h-4 w-4" />
                                退出
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogin}
                                className="flex items-center gap-1"
                            >
                                <QrCode className="h-4 w-4" />
                                扫码登录
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}