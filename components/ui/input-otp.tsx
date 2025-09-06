"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface InputOTPProps extends React.HTMLAttributes<HTMLDivElement> {
  maxLength: number
  value: string
  onChange: (value: string) => void
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, maxLength, value, onChange, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        {props.children}
      </div>
    )
  }
)
InputOTP.displayName = "InputOTP"

interface InputOTPGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputOTPGroup = React.forwardRef<HTMLDivElement, InputOTPGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center", className)} {...props}>
        {props.children}
      </div>
    )
  }
)
InputOTPGroup.displayName = "InputOTPGroup"

interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
}

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ className, index, ...props }, ref) => {
    const parent = React.useContext(InputOTPContext)
    const value = parent?.value || ""
    const char = value[index] || ""
    const isActive = index === value.length
    const isComplete = index < value.length

    const handleClick = () => {
      const input = document.querySelector(`#otp-input-${index}`) as HTMLInputElement
      input?.focus()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      const currentValue = parent?.value || ""
      
      if (newValue.length <= 1 && /^\d*$/.test(newValue)) {
        let updatedValue = currentValue.split("")
        updatedValue[index] = newValue
        const finalValue = updatedValue.join("").slice(0, parent?.maxLength || 6)
        parent?.onChange?.(finalValue)
        
        // Auto-focus next input
        if (newValue && index < (parent?.maxLength || 6) - 1) {
          const nextInput = document.querySelector(`#otp-input-${index + 1}`) as HTMLInputElement
          nextInput?.focus()
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !char && index > 0) {
        const prevInput = document.querySelector(`#otp-input-${index - 1}`) as HTMLInputElement
        prevInput?.focus()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-10 w-10 text-sm border rounded-md flex items-center justify-center",
          {
            "border-primary": isActive,
            "border-input": !isActive,
            "bg-accent": isComplete,
          },
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <input
          id={`otp-input-${index}`}
          className="absolute inset-0 w-full h-full text-center bg-transparent border-0 outline-none"
          value={char}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={1}
          type="text"
          inputMode="numeric"
          pattern="\d*"
        />
      </div>
    )
  }
)
InputOTPSlot.displayName = "InputOTPSlot"

// Create context for OTP communication
const InputOTPContext = React.createContext<{
  value: string
  onChange: (value: string) => void
  maxLength: number
} | null>(null)

// Enhanced InputOTP with context
const EnhancedInputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ maxLength, value, onChange, children, ...props }, ref) => {
    return (
      <InputOTPContext.Provider value={{ value, onChange, maxLength }}>
        <InputOTP ref={ref} maxLength={maxLength} value={value} onChange={onChange} {...props}>
          {children}
        </InputOTP>
      </InputOTPContext.Provider>
    )
  }
)
EnhancedInputOTP.displayName = "EnhancedInputOTP"

export { EnhancedInputOTP as InputOTP, InputOTPGroup, InputOTPSlot }
