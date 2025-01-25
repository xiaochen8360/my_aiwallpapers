import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              "w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500",
              "text-sm transition-all duration-200",
              "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400",
              "hover:border-gray-300 dark:hover:border-gray-600",
              "shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
              className
            )}
            ref={ref}
            {...props}
          />
          {error && (
            <p className="mt-1 text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
