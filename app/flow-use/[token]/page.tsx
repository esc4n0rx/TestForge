"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function FlowUseRedirectPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    useEffect(() => {
        // Redirect to the new client test route
        if (token) {
            router.replace(`/client/test/${token}`)
        }
    }, [token, router])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Redirecionando...</p>
            </div>
        </div>
    )
}
