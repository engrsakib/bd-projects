"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronLeft, ChevronRight, RotateCcw, Images, X } from "lucide-react";

// Lightbox (SSR-safe)
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
 ssr: false,
});
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface ImageGalleryProps {
 images: string[];
 productName: string;
 spinImages?: string[];
}

export function ImageGallery({
 images,
 productName,
 spinImages = [],
}: ImageGalleryProps) {
 const hasSpin = spinImages.length > 8;
 const [selectedImage, setSelectedImage] = useState(0);
 const [isOpen, setIsOpen] = useState(false);
 const [mode, setMode] = useState<"image" | "spin">(
  hasSpin ? "image" : "image",
 );

 const slides = useMemo(() => images.map((src) => ({ src })), [images]);

 const nextImage = () => setSelectedImage((p) => (p + 1) % images.length);
 const prevImage = () =>
  setSelectedImage((p) => (p - 1 + images.length) % images.length);

 return (
  <div className='space-y-4'>
   {/* Mode switcher (360° or Photos) */}
   {hasSpin && (
    <div className='flex gap-2'>
     <button
      onClick={() => setMode("image")}
      className={`px-3 py-1.5 rounded-md text-sm ${
       mode === "image" ? "bg-secondary text-white" : "bg-gray-100"
      } flex items-center gap-2`}>
      <Images className='w-4 h-4' /> Photos
     </button>
     <button
      onClick={() => setMode("spin")}
      className={`px-3 py-1.5 rounded-md text-sm ${
       mode === "spin" ? "bg-secondary text-white" : "bg-gray-100"
      } flex items-center gap-2`}>
      <RotateCcw className='w-4 h-4' /> 360° View
     </button>
    </div>
   )}

   {/* Main viewer */}
   <div className='relative group bg-white rounded-md border border-gray-200'>
    <div className='aspect-square'>
     {mode === "image" ? (
      <MagnifyImage
       src={images[selectedImage]}
       onClick={() => setIsOpen(true)}
       alt={`${productName} image`}
      />
     ) : (
      <SpinViewer frames={spinImages} />
     )}

     {/* Arrows */}
     {mode === "image" && images.length > 1 && (
      <>
       <div className='absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300'>
        <button
         onClick={prevImage}
         className='w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 flex items-center justify-center'>
         <ChevronLeft className='h-5 w-5 text-secondary' />
        </button>
       </div>
       <div className='absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300'>
        <button
         onClick={nextImage}
         className='w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 flex items-center justify-center'>
         <ChevronRight className='h-5 w-5 text-secondary' />
        </button>
       </div>
      </>
     )}

     {/* Counter */}
     {mode === "image" && images.length > 1 && (
      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-secondary/80 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm'>
       {selectedImage + 1} / {images.length}
      </div>
     )}
    </div>
   </div>

   {/* Thumbnails */}
   {mode === "image" && images.length > 1 && (
    <div className='flex gap-3 overflow-x-auto py-2 px-2'>
     {images.map((image, index) => (
      <button
       key={index}
       onClick={() => setSelectedImage(index)}
       className={`relative flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden transition-all duration-300 ${
        selectedImage === index
         ? "ring-2 ring-primary shadow-lg"
         : "ring-1 ring-gray-200 hover:ring-primary/50 shadow-sm hover:shadow-md"
       }`}>
       <Image
        src={image}
        alt={`${productName} thumbnail ${index + 1}`}
        fill
        className='object-cover'
        loading='lazy'
       />
      </button>
     ))}
    </div>
   )}

   {/* Fullscreen Lightbox */}
   {isOpen && (
    <Lightbox
     open={isOpen}
     close={() => setIsOpen(false)}
     index={selectedImage}
     slides={slides}
     plugins={[Zoom, Thumbnails, Fullscreen]}
     carousel={{ finite: false }}
     animation={{ fade: 250 }}
     controller={{ closeOnBackdropClick: true }}
     on={{ view: ({ index }) => setSelectedImage(index) }}
     styles={{
      container: { backgroundColor: "rgba(0,0,0,0.7)" }, // black/10 overlay
     }}
     //  render={{
     //   buttonClose: () => (
     //    <button
     //     onClick={() => setIsOpen(false)}
     //     className='absolute top-4 right-4 z-50 bg-black/10 p-2 rounded-full'
     //     aria-label='Close'>
     //     <X className='text-white w-5 h-5' />
     //    </button>
     //   ),
     //  }}
    />
   )}
  </div>
 );
}

/** Custom Magnify Glass (no external lib) */
function MagnifyImage({
 src,
 alt,
 onClick,
}: {
 src: string;
 alt: string;
 onClick: () => void;
}) {
 const [lensPos, setLensPos] = useState<{ x: number; y: number } | null>(null);
 const [isMobile, setIsMobile] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

 // detect mobile once
 useEffect(() => {
  const mobileCheck =
   typeof window !== "undefined" &&
   (window.matchMedia("(max-width: 768px)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  setIsMobile(mobileCheck);
 }, []);

 const handleMove = (e: React.MouseEvent) => {
  if (isMobile || !containerRef.current) return; // stop magnify on mobile
  const { left, top, width, height } =
   containerRef.current.getBoundingClientRect();
  const x = e.clientX - left;
  const y = e.clientY - top;
  setLensPos({ x: (x / width) * 100, y: (y / height) * 100 });
 };

 return (
  <div
   ref={containerRef}
   className='relative w-full h-full cursor-zoom-in z-[57]'
   onMouseMove={handleMove}
   onMouseLeave={() => setLensPos(null)}
   onClick={onClick} // mobile tap still opens lightbox
  >
   <Image
    src={src}
    alt={alt}
    fill
    className='object-cover select-none pointer-events-none'
   />

   {/* Only show zoom lens on desktop */}
   {!isMobile && lensPos && (
    <div
     className='absolute pointer-events-none border-2 border-white rounded-full shadow-lg'
     style={{
      top: `calc(${lensPos.y}% - 75px)`,
      left: `calc(${lensPos.x}% - 75px)`,
      width: "400px",
      height: "400px",
      backgroundImage: `url(${src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "350% 350%",
      backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
     }}
    />
   )}
  </div>
 );
}

/** 360° spin viewer */
function SpinViewer({ frames }: { frames: string[] }) {
 const [i, setI] = useState(0);
 const startX = useRef<number | null>(null);
 const frameCount = frames.length;

 const updateFromDelta = (dx: number) => {
  const step = Math.round(dx / 8);
  if (step !== 0) {
   setI((prev) => (prev + (step % frameCount) + frameCount) % frameCount);
   startX.current = null;
  }
 };

 return (
  <div
   className='relative w-full h-full select-none'
   onMouseDown={(e) => (startX.current = e.clientX)}
   onMouseMove={(e) => {
    if (startX.current !== null) updateFromDelta(e.clientX - startX.current);
   }}
   onMouseUp={() => (startX.current = null)}
   onMouseLeave={() => (startX.current = null)}
   onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
   onTouchMove={(e) => {
    if (startX.current !== null)
     updateFromDelta(e.touches[0].clientX - startX.current);
   }}
   onTouchEnd={() => (startX.current = null)}>
   <Image
    src={frames[i] || "/placeholder.svg?height=600&width=600"}
    alt={`360 frame ${i + 1}`}
    fill
    className='object-cover'
   />
   <div className='absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded'>
    {i + 1}/{frameCount}
   </div>
   <div className='absolute inset-x-0 bottom-1 text-center text-[11px] text-white/90'>
    Drag/Swipe to rotate
   </div>
  </div>
 );
}