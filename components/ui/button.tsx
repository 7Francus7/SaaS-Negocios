import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
       variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
       size?: 'default' | 'sm' | 'lg' | 'icon'
       isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
       ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {

              // Base styles
              const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] transition-all duration-200"

              // Variant styles
              const variants = {
                     default: "bg-gray-900 text-white hover:bg-gray-900/90 shadow-sm hover:shadow-md",
                     destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-red-100",
                     outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900",
                     secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200/80",
                     ghost: "hover:bg-gray-100 hover:text-gray-900",
                     link: "text-blue-600 underline-offset-4 hover:underline",
              }

              // Size styles
              const sizes = {
                     default: "h-10 px-4 py-2",
                     sm: "h-9 rounded-md px-3",
                     lg: "h-11 rounded-md px-8",
                     icon: "h-10 w-10",
              }

              return (
                     <button
                            className={cn(baseStyles, variants[variant], sizes[size], className)}
                            ref={ref}
                            disabled={disabled || isLoading}
                            {...props}
                     >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {children}
                     </button>
              )
       }
)
Button.displayName = "Button"

export { Button }
