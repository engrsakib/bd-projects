"use client";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import LoadingHeroSkeleton from "./hero-sekelton";
import { useGetBannerQueryQuery } from "@/redux/api/api-query";

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD = 40; // px

const HeroMain: React.FC = () => {
  const { data: bannerData, isLoading } = useGetBannerQueryQuery();
  const router = useRouter();

  const [currentSlider, setCurrentSlider] = useState(0);
  const [isSlideStop, setIsSlideStop] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 fwd, -1 back

  const dragX = useMotionValue(0);
  const controls = useAnimation();
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize API → image urls array (supports both old & new shapes)
  const bannerImages: string[] = useMemo(() => {
    const raw = (bannerData as any)?.data ?? bannerData ?? [];
    const list = Array.isArray(raw) ? raw : raw?.banners ?? [];
    return (list || [])
      .map((b: any) => b?.banner_url || b?.thumbnail)
      .filter(Boolean);
  }, [bannerData]);

  const total = bannerImages.length;

  // keep index in range if data changes
  useEffect(() => {
    if (!total) return;
    setCurrentSlider((idx) => Math.min(Math.max(idx, 0), total - 1));
  }, [total]);

  // ping-pong autoplay with direction
  const nextSlider = useCallback(() => {
    if (total <= 1) return;
    setCurrentSlider((curr) => {
      if (direction === 1 && curr >= total - 1) {
        setDirection(-1);
        return Math.max(total - 2, 0);
      } else if (direction === -1 && curr <= 0) {
        setDirection(1);
        return Math.min(1, total - 1);
      } else {
        return curr + direction;
      }
    });
  }, [direction, total]);

  // autoplay timer (pauses on interaction)
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      if (!isSlideStop) nextSlider();
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [nextSlider, isSlideStop, total]);

  // pause autoplay when tab not visible
  useEffect(() => {
    const onVis = () => setIsSlideStop(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // helpers to manage temporary pause
  const pauseThenResume = useCallback(() => {
    setIsSlideStop(true);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => setIsSlideStop(false), AUTOPLAY_MS);
  }, []);

  const onDragEnd = () => {
    const x = dragX.get();

    if (total > 0) {
      if (x <= -SWIPE_THRESHOLD && currentSlider < total - 1) {
        setCurrentSlider((prev: number) => prev + 1);
        setDirection(1);
      } else if (x >= SWIPE_THRESHOLD && currentSlider > 0) {
        setCurrentSlider((prev: number) => prev - 1);
        setDirection(-1);
      }
    }

    pauseThenResume();

    controls.start({
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    });
  };

  const onDragStart = () => setIsSlideStop(true);
  const onMouseDown = () => setIsSlideStop(true);
  const onMouseUp = () => setIsSlideStop(false);
  const onTouchStart = () => setIsSlideStop(true);
  const onTouchEnd = (_e: React.TouchEvent) => setIsSlideStop(false);

  // pause on hover/focus, resume on leave/blur
  const onMouseEnter = () => setIsSlideStop(true);
  const onMouseLeave = () => setIsSlideStop(false);

  const handleClickSetSlider = (inx: number) => {
    if (inx < 0 || inx > total - 1) return;
    setCurrentSlider(inx);
    pauseThenResume();
  };

  // keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!total) return;
    if (e.key === "ArrowLeft") {
      setIsSlideStop(true);
      setDirection(-1);
      setCurrentSlider((s) => Math.max(0, s - 1));
    }
    if (e.key === "ArrowRight") {
      setIsSlideStop(true);
      setDirection(1);
      setCurrentSlider((s) => Math.min(total - 1, s + 1));
    }
  };

  if (!bannerData || isLoading) {
    return <LoadingHeroSkeleton />;
  }

  // Empty state fallback
  if (total === 0) {
    return (
      <div className="w-full lg:mb-10 md:mb-7 mb-4">
        <div className="w-full h-[220px] md:h-[360px] lg:h-[460px] bg-gray-100 grid place-items-center rounded-lg">
          <p className="text-sm text-gray-500">No banners available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full  mb-4 flex flex-col lg:flex-row h-auto gap-0.5 sm:gap-4 md:gap-5"
      onKeyDown={onKeyDown}
      tabIndex={0}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="grow overflow-hidden h-fit relative">
        {/* dots */}
        <div className="flex justify-center items-center rounded-full z-50 absolute bottom-2 md:bottom-4 w-full gap-1 opacity-80">
          {bannerImages.map((_, inx: number) => (
            <button
              key={inx}
              aria-label={"Slider Button " + (inx + 1)}
              aria-current={currentSlider === inx}
              onClick={() => handleClickSetSlider(inx)}
              className={`rounded-full duration-500 bg-primary ${currentSlider === inx ? "w-8" : "w-2"} h-2`}
            />
          ))}
        </div>

        <div className="w-full h-fit">
          {/* desktop hero slider */}
          <motion.div
            className="ease-linear duration-300 hidden sm:flex items-start h-auto"
            drag={total > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
            animate={{ x: `-${currentSlider * 100}%` }}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {bannerImages.map((src: string, idx: number) => (
              <div key={idx} className="min-w-full w-full select-none cursor-pointer">
                <div className="relative w-full" style={{ aspectRatio: "2.5 / 1" }}>
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Slider - ${idx + 1}`}
                    fill
                    priority={idx < 2}
                    draggable={false}
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 100vw"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* mobile hero slider */}
          <motion.div
            className="ease-linear duration-200 flex sm:hidden"
            drag={total > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
            animate={{ x: `-${currentSlider * 100}%` }}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {bannerImages.map((src: string, inx: number) => (
              <div key={inx} className="min-w-full w-full select-none">
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Slider - ${inx + 1}`}
                    fill
                    priority={inx === 0}
                    draggable={false}
                    className="object-cover"
                    sizes="100vw"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default HeroMain;
