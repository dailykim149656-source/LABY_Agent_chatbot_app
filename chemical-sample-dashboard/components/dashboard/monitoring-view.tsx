"use client"

import { useState } from "react"
import {
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Box,
  Layers,
  Eye,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function MonitoringView() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleFullscreen = () => {
    const elem = document.getElementById("digital-twin-container")
    if (elem) {
      if (!document.fullscreenElement) {
        elem.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  return (
    <div
      id="digital-twin-container"
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#0a0a0f]"
    >
      {/* Dark gradient background with grid effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d18] to-[#0a0a0f]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Top status bar */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-black/30 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/30 bg-primary/10 text-primary"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            실시간
          </Badge>
          <span className="text-xs text-white/40">Azure Digital Twins</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/40">
          <Layers className="size-3" />
          <span>화학 실험실 B동 - 3D 모델</span>
        </div>
      </div>

      {/* Main 3D viewport area */}
      <div className="relative flex flex-1 items-center justify-center">
        {/* Central 3D model placeholder */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            {/* Glowing ring effect */}
            <div className="absolute -inset-8 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -inset-4 rounded-full bg-primary/10 blur-xl" />

            {/* 3D Icon */}
            <div className="relative flex size-32 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <Box className="size-16 text-white/20" />
            </div>
          </div>

          <p className="mt-8 text-lg font-medium tracking-wide text-white/70">
            3D Laboratory Digital Twin
          </p>
          <p className="mt-2 text-sm text-white/30">
            WebGL 렌더링 영역 - 마우스로 회전 및 확대/축소
          </p>

          {/* Coordinate indicator */}
          <div className="mt-6 flex items-center gap-4 text-xs text-white/20">
            <span>X: 0.00</span>
            <span>Y: 0.00</span>
            <span>Z: 0.00</span>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute left-4 top-4 size-8 border-l-2 border-t-2 border-white/10" />
        <div className="absolute right-4 top-4 size-8 border-r-2 border-t-2 border-white/10" />
        <div className="absolute bottom-4 left-4 size-8 border-b-2 border-l-2 border-white/10" />
        <div className="absolute bottom-4 right-4 size-8 border-b-2 border-r-2 border-white/10" />
      </div>

      {/* Floating control panel */}
      <TooltipProvider>
        <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-lg border border-white/10 bg-black/50 p-1.5 backdrop-blur-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <Move3D className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>이동</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>회전</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <ZoomIn className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>확대</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <ZoomOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>축소</p>
            </TooltipContent>
          </Tooltip>

          <div className="my-1 border-t border-white/10" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <Eye className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>레이어 보기</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="size-9 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <Maximize2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>전체 화면</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Bottom info bar */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-t border-white/5 bg-black/30 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-xs text-white/30">
          <span>FPS: 60</span>
          <span>Triangles: 245,832</span>
          <span>Draw Calls: 128</span>
        </div>
        <div className="text-xs text-white/30">
          마지막 동기화: 방금 전
        </div>
      </div>
    </div>
  )
}
