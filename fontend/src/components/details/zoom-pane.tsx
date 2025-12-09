"use client"

export type ZoomPaneProps = {
  src: string
  imgSize: { w: number; h: number }
  pos: { x: number; y: number } | null
  zoom?: number
  paneWidth?: number
  paneHeight?: number
}

const ZoomPane = ({
  src,
  imgSize,
  pos,
  zoom = 2.8,
  paneWidth = 520,
  paneHeight,
}: ZoomPaneProps) => {
  const bgSize = `${imgSize.w * zoom}px ${imgSize.h * zoom}px`
  const h = paneHeight ?? imgSize.h
  const bgPos = pos
    ? `${-(pos.x * zoom - paneWidth / 2)}px ${-(pos.y * zoom - h / 2)}px`
    : `center center`

  return (
    <div
      className="rounded-2xl bg-white border border-gray-200 overflow-hidden"
      style={{
        width: "100%",
        height: h,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: bgSize,
        backgroundPosition: bgPos,
      }}
    />
  )
}

export default ZoomPane
