"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { HardDrive } from "lucide-react"
import type { SpaceStats } from "@/lib/types/space"

interface StorageStatsCardProps {
    stats: SpaceStats
    planName?: string
}

export function StorageStatsCard({ stats, planName }: StorageStatsCardProps) {
    const isUnlimited = stats.limit === -1
    const percentageColor =
        stats.percentageUsed >= 90 ? "bg-destructive" :
            stats.percentageUsed >= 70 ? "bg-yellow-500" :
                "bg-primary"

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-sm font-medium">Storage de Evidências</CardTitle>
                    <CardDescription className="text-xs mt-1">
                        {isUnlimited ? "Armazenamento ilimitado" : `${stats.totalFiles} de ${stats.limit} evidências utilizadas`}
                    </CardDescription>
                </div>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {!isUnlimited && (
                    <div className="space-y-2">
                        <Progress value={stats.percentageUsed} className="h-2" indicatorClassName={percentageColor} />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{stats.totalMB} MB utilizados</span>
                            <span>{stats.percentageUsed.toFixed(1)}%</span>
                        </div>
                    </div>
                )}
                {planName && (
                    <Badge variant="secondary" className="mt-3">
                        {planName}
                    </Badge>
                )}
            </CardContent>
        </Card>
    )
}
