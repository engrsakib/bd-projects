"use client";

import type React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "./search-bar";

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  isError?: boolean;
  searchQuery: string;
  searchResults: Product[];
  onProductClick: (product: Product) => void;
  onSeeAll: () => void;
};

const pop = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.12 } },
};

const SkeletonRow = () => (
  <li className="flex items-center gap-3 px-4 py-2">
    <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
    <div className="flex-1 space-y-1">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
  </li>
);

function computePricing(variants?: Product["variants"]) {
  if (!variants || variants.length === 0) return { hasPrice: false } as const;

  let best = variants[0];
  const eff = (v: any) =>
    typeof v?.sale_price === "number"
      ? v.sale_price
      : typeof v?.regular_price === "number"
      ? v.regular_price
      : Number.POSITIVE_INFINITY;

  for (const v of variants) if (eff(v) < eff(best)) best = v;

  const regular =
    typeof best?.regular_price === "number" ? best.regular_price : undefined;
  const sale =
    typeof best?.sale_price === "number"
      ? best.sale_price
      : typeof regular === "number"
      ? regular
      : undefined;

  if (typeof sale !== "number") return { hasPrice: false } as const;

  const discount =
    typeof regular === "number" && regular > sale
      ? Math.round(((regular - sale) / regular) * 100)
      : 0;

  return { hasPrice: true as const, sale, regular, discount };
}

const SearchDropdown: React.FC<Props> = ({
  isOpen,
  isLoading,
  isError,
  searchQuery,
  searchResults,
  onProductClick,
  onSeeAll,
}) => {
  const showResults = searchResults.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pop}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {isLoading && (
            <ul className="py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={`s-${i}`} />
              ))}
            </ul>
          )}

          {!isLoading && isError && (
            <div className="px-4 py-6 text-center text-gray-500">
              <p className="text-sm">Something went wrong. Please try again.</p>
            </div>
          )}

          {!isLoading && !isError && showResults && (
            <>
              <ul className="py-1">
                {searchResults.map((p) => {
                  const name = (p?.name || "").replace(/<[^>]*>/g, "");
                  const pricing = computePricing(p.variants);
                  return (
                    <li key={p._id}>
                      <button
                        onClick={() => onProductClick(p)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 transition-colors text-left"
                        role="option"
                        aria-selected="false"
                      >
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          <Image
                            src={p.thumbnail || "/placeholder.svg"}
                            alt={name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {name || "Unnamed product"}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-700">
                            {pricing.hasPrice ? (
                              <>
                                <span className="text-green-600 font-semibold">
                                  ৳{pricing.sale.toLocaleString()}
                                </span>
                                {typeof pricing.regular === "number" &&
                                  pricing.regular > pricing.sale && (
                                    <>
                                      <span className="line-through text-gray-400">
                                        ৳{pricing.regular.toLocaleString()}
                                      </span>
                                      {pricing.discount > 0 && (
                                        <span className="text-red-500">
                                          ({pricing.discount}% off)
                                        </span>
                                      )}
                                    </>
                                  )}
                              </>
                            ) : (
                              <span className="text-gray-500">
                                Price unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* <div className="border-t border-gray-100">
                <button
                  className="w-full px-4 py-2.5 text-sm font-medium text-pink-600 hover:bg-pink-50 transition-colors"
                  onClick={onSeeAll}
                >
                  See all results for “{searchQuery}”
                </button>
              </div> */}
            </>
          )}

          {!isLoading && !isError && !showResults && searchQuery.trim().length > 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="text-sm">No products found for “{searchQuery}”.</div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchDropdown;
