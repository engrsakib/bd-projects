"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useGetAllSubCategoriesQuery } from "@/redux/api/api-query";
import { Container } from "@/components/common/container";

const CategoryCard = ({ item }: { item: any }) => {
  const imageUrl = item.image || item.img || "/placeholder.svg";
  const name = item.name || "Category";
  const linkHref = `/shop?category=${item.slug || item._id}`;

  return (
    <Link
      href={linkHref}
      className=" block h-full w-full"
      aria-label={`Shop ${name}`}
    >
      <div
        
        className="relative aspect-square w-full overflow-hidden  "
      >
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
            className="object-cover "
            priority={false}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/6 to-black/10 pointer-events-none" />
        </div>

        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 w-full text-center">
          <span className="inline-block  rounded-b-xl bg-white/90 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide line-clamp-1 text-gray-900 shadow-lg backdrop-blur-sm">
            {name}
          </span>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-6 blur-[18px] opacity-60 rounded-full bg-black/20 pointer-events-none" />
      </div>
    </Link>
  );
};

const CategorySkeleton = () => (
  <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-gray-200/40" />
);

const HomeCategorySection = () => {
  const {
    data: catRes,
    isLoading: catsLoading,
    error: catsError,
  } = useGetAllSubCategoriesQuery({});

  const subcategories = useMemo(
    () => catRes?.data?.data || [],
    [catRes?.data?.data]
  );

  if (catsError) {
    return (
      <section className="py-12">
        <Container>
          <div className="rounded-lg p-4 text-center text-red-600">
            Failed to load categories. Please try again later.
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-5 pb-10">
      <Container>
        <div className="w-fit mb-4">
          <h3
            id={`subcategory`}
            className="font-bold uppercase tracking-wide text-secondary"
          >
            Category
          </h3>
          <div className="mt-1 h-[2px] w-full bg-secondary" />
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {catsLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))
          ) : subcategories.length > 0 ? (
            subcategories.map((item: any) => (
              <CategoryCard
                key={item.id || item._id || item.slug || item.name}
                item={item}
              />
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-gray-500">
              No categories found.
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

export default HomeCategorySection;
