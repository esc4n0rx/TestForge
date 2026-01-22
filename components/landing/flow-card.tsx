"use client"

import { useCallback, useEffect } from "react"
import {
    ReactFlow,
    Node,
    Edge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

interface FlowCardProps {
    nodes: Node[]
    edges: Edge[]
    className?: string
}

export function FlowCard({ nodes, edges, className = "" }: FlowCardProps) {
    const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes)
    const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

    useEffect(() => {
        setNodes(nodes)
        setEdges(edges)
    }, [nodes, edges, setNodes, setEdges])

    return (
        <div className={`relative bg-background/95 rounded-xl p-4 ${className}`}>
            <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                attributionPosition="bottom-left"
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="hsl(var(--primary) / 0.05)" gap={16} size={1} />
            </ReactFlow>
        </div>
    )
}
