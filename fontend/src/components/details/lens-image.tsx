"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"

export type LensImageProps = {
    src: string
    alt: string
    lensSize?: number
    onPos?: (pos: { x: number; y: number } | null) => void
    onSize?: (size: { w: number; h: number }) => void
    onHoverChange?: (active: boolean) => void
}

const LensImage = ({
    src,
    alt,
    lensSize = 180,
    onPos,
    onSize,
    onHoverChange,
}: LensImageProps) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => {
            const rect = el.getBoundingClientRect()
            const size = { w: rect.width, h: rect.height }
            setImgSize(size)
            onSize?.(size)
        }
        update()
        const obs = new ResizeObserver(update)
        obs.observe(el)
        return () => obs.disconnect()
    }, [onSize])

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

    const handleMove = (e: React.MouseEvent) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const r = lensSize / 2
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        x = clamp(x, r, rect.width - r)
        y = clamp(y, r, rect.height - r)
        const p = { x, y }
        setPos(p)
        onPos?.(p)
    }

    const handleEnter = () => {
        onHoverChange?.(true)
    }
    const handleLeave = () => {
        setPos(null)
        onPos?.(null)
        onHoverChange?.(false)
    }

    return (
        <div
            ref={ref}
            className="relative select-none overflow-hidden rounded-2xl bg-gray-50"
            onMouseMove={handleMove}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            style={{ aspectRatio: "1 / 1", width: "100%" }}
        >
            <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover"
                priority
            />
            {pos && (
                <div
                    className="pointer-events-none absolute  border border-white/70 "
                    style={{
                        width: lensSize,
                        height: lensSize,
                        left: pos.x - lensSize / 2,
                        top: pos.y - lensSize / 2,
                        background:
                            "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.6) 100%, rgba(0,0,0,0.06) 100%)",
                    }}
                />
            )}
        </div>
    )
}

export default LensImage
