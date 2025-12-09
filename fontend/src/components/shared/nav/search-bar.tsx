"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchDropdown from "./search-dropdown";
import { useSearchProductsQuery } from "@/redux/api/products-query";

type Variant = {
    regular_price?: number;
    sale_price?: number;
};

export interface Product {
    _id: string;
    name: string;
    slug?: string;
    thumbnail?: string;
    variants?: Variant[];
    [key: string]: any;
}

function extractProducts(payload: any): Product[] {
    if (!payload) return [];
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data?.products)) return payload.data.products;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
}

function useDebounced<T>(value: T, ms = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(id);
    }, [value, ms]);
    return debounced;
}

const SearchBar = () => {
    const router = useRouter();
    const rootRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);

    const debounced = useDebounced(query, 300);

    const { data, isFetching, isLoading, isError } = useSearchProductsQuery(debounced, {
        skip: !debounced || debounced.trim().length < 1,
    });

    const results: Product[] = useMemo(() => extractProducts(data), [data]);
    const loading = isFetching || isLoading;

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const goSearchPage = () => {
        const q = query.trim();
        if (!q) return;
        setOpen(false);
        router.push(`/search?q=${encodeURIComponent(q)}`);
    };

    const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") goSearchPage();
    };

    const onProductClick = (p: Product) => {
        setQuery("");
        setOpen(false);
        router.push(`/product/${p.slug ?? p._id}`);
    };

    return (
        <div className="hidden md:block flex-1 max-w-md mx-8" ref={rootRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!open) setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onEnter}
                    className="block w-full pl-10 text-sm pr-3 py-2 border border-[#2a2b4a] rounded-lg bg-[#2a2b4a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Search products..."
                    aria-label="Search products"
                    aria-haspopup="listbox"
                />

                <SearchDropdown
                    isOpen={open && query.trim().length > 0}
                    isLoading={loading}
                    isError={isError}
                    searchQuery={query}
                    searchResults={results}
                    onProductClick={onProductClick}
                    onSeeAll={goSearchPage}
                />
            </div>
        </div>
    );
};

export default SearchBar;
