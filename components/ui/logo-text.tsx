import { cn } from "@/lib/utils"

interface LogoTextProps {
    className?: string
    size?: "sm" | "md" | "lg" | "xl"
}

export function LogoText({ className, size = "md" }: LogoTextProps) {
    const sizeClasses = {
        sm: "text-xl",
        md: "text-2xl",
        lg: "text-3xl",
        xl: "text-4xl",
    }

    return (
        <h1
            className={cn(
                "font-bold tracking-tight",
                sizeClasses[size],
                className
            )}
        >
            <span style={{ color: "#5B9BD5" }}>Test</span>
            <span style={{ color: "#50E3C2" }}>Forge</span>
        </h1>
    )
}
