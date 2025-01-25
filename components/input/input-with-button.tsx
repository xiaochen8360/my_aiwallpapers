"use client"

import { Button } from "@/components/ui/button"
import { Input } from "./index"
import { useState } from "react"
import { useAuthStore, handleLogin } from "@/components/header"

interface InputWithButtonProps {
  placeholder?: string;
  buttonText?: string;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
}

export function InputWithButton({
  placeholder = "请输入提示词",
  buttonText = "生成",
  onSubmit,
  disabled = false,
}: InputWithButtonProps) {
  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;

    // 如果用户未登录，显示扫码登录窗口
    if (!user) {
      handleLogin()
      return
    }

    setIsLoading(true);
    setError(null);
    console.log('开始生成，描述文本:', value.trim());

    try {
      console.log('发送请求到 /api/gen_wallpaper');
      const response = await fetch('/api/gen_wallpaper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: value.trim() }),
      });

      console.log('收到响应:', response.status, response.statusText);
      const data = await response.json();
      console.log('响应数据:', data);

      if (!response.ok || data.code === -1) {
        throw new Error(data.message || '生成失败');
      }

      console.log('生成成功，URL:', data.data.img_url);
      // 生成成功后，如果有传入 onSubmit 回调，则调用它
      if (onSubmit) {
        onSubmit(value.trim());
      }

      // 清空输入框
      setValue('');
      
      // 触发壁纸生成事件
      window.dispatchEvent(new Event('wallpaperGenerated'));
      
      // 显示成功提示
      alert('生成成功！');
      
    } catch (error) {
      console.error('生成失败:', error);
      setError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="flex gap-3 w-full max-w-2xl">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1 h-12 text-lg border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              disabled={disabled || isLoading}
            />
            <Button 
              variant="default"
              size="lg"
              onClick={handleSubmit}
              disabled={disabled || !value.trim() || isLoading}
              className="min-w-24 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              {isLoading ? "生成中..." : buttonText}
            </Button>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
