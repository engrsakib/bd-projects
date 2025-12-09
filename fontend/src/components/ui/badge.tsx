import type { ReactNode } from "react"

interface BadgeProps {
  children: ReactNode
  variant?: "primary" | "outline" | "destructive" | "success"
  className?: string
}

export function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  const variantClasses = {
    primary: "bg-[#EFBB29] text-[#023344] hover:bg-[#EFBB29]/90",
    outline: "border border-[#023344] text-[#023344] bg-transparent",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-green-500 text-white hover:bg-green-600",
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold transition-colors ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
