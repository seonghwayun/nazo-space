"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement)

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const textarea = innerRef.current
      if (!textarea) return

      e.preventDefault(); // Prevent scrolling while dragging

      const startY = e.clientY
      const startHeight = textarea.offsetHeight

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const newHeight = startHeight + (moveEvent.clientY - startY)
        textarea.style.height = `${Math.max(60, newHeight)}px`
      }

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", handlePointerUp)
      }

      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerUp)
    }

    return (
      <div className="relative w-full group">
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
            "pb-8 resize-none"
          )}
          ref={innerRef}
          {...props}
        />
        <div
          className="absolute bottom-1 right-1 p-2 cursor-ns-resize touch-none opacity-50 hover:opacity-100 transition-opacity"
          onPointerDown={handlePointerDown}
        >
          {/* Custom diagonal resize handle */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground"
          >
            <path d="M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 5L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 9L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
