'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import OrderCard from "@/components/orders/order-card";
import OrderSkeleton from "@/components/orders/order-skeleton";
import { Order, useGetMyOrdersQuery } from "@/redux/api/order-query";
import { Container } from "@/components/common/container";
import { ORDER_STATUS } from "@/types";

const OrderHistory = () => {
    const [filter, setFilter] = useState<string>("all");
    const { data, isLoading: loading } = useGetMyOrdersQuery();
    const orders: Order[] = useMemo(() => data?.data ?? [], [data]);
    const moreRef = useRef<HTMLDetailsElement>(null);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: orders.length };
        for (const o of orders) c[o.order_status] = (c[o.order_status] ?? 0) + 1;
        return c;
    }, [orders]);


    const PRIMARY: Array<{ value: string; label: string }> = [
        { value: "all", label: "All" },
        { value: ORDER_STATUS.PENDING, label: "Pending" },
        { value: ORDER_STATUS.IN_TRANSIT, label: "In transit" },
        { value: ORDER_STATUS.DELIVERED, label: "Delivered" },
    ];
    const SECONDARY: Array<{ value: string; label: string }> = [
        { value: ORDER_STATUS.PLACED, label: "Placed" },
        { value: ORDER_STATUS.ACCEPTED, label: "Accepted" },
        { value: ORDER_STATUS.SHIPPED, label: "Shipped" },
        { value: ORDER_STATUS.HANDED_OVER_TO_COURIER, label: "Handed to courier" },
        { value: ORDER_STATUS.PARTIAL_DELIVERED, label: "Partial delivered" },
        { value: ORDER_STATUS.PENDING_RETURN, label: "Pending return" },
        { value: ORDER_STATUS.RETURNED, label: "Returned" },
        { value: ORDER_STATUS.EXCHANGE_REQUESTED, label: "Exchange requested" },
        { value: ORDER_STATUS.EXCHANGED, label: "Exchanged" },
        { value: ORDER_STATUS.FAILED, label: "Failed" },
        { value: ORDER_STATUS.CANCELLED, label: "Cancelled" },
    ];

    const filtered = filter === "all" ? orders : orders.filter((o) => o.order_status === filter);

    const pick = (value: string) => {
        setFilter(value);
        // close <details> if open
        requestAnimationFrame(() => {
            if (moreRef.current?.open) moreRef.current.open = false;
        });
    };

    // Close More on outside click or Esc
    useEffect(() => {
        const closeIfOutside = (e: MouseEvent | TouchEvent) => {
            const el = moreRef.current;
            if (!el || !el.open) return;
            const target = e.target as Node | null;
            if (target && !el.contains(target)) {
                el.open = false;
            }
        };


        document.addEventListener("mousedown", closeIfOutside);
        document.addEventListener("touchstart", closeIfOutside, { passive: true });


        return () => {
            document.removeEventListener("mousedown", closeIfOutside);
            document.removeEventListener("touchstart", closeIfOutside);
        };
    }, []);

    return (
        <Container
            className=" py-6 sm:px-6 lg:px-8"
        >
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <header className="mb-5 sm:mb-6">
                    <h1 className="text-2xl font-medium tracking-tight text-primary">Order History</h1>
                    <p className="mt-1 text-[13px] text-slate-600">Track and manage your orders at a glance.</p>
                </header>

                <div className="mb-5 flex flex-wrap items-center gap-2">
                    {PRIMARY.map((s) => {
                        const active = filter === s.value;
                        return (
                            <button
                                key={s.value}
                                onClick={() => pick(s.value)}
                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors duration-200 ${active
                                        ? "border-primary-mid bg-primary/10 text-primary-dark"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <span>{s.label}</span>
                                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/70" : "bg-slate-100"}`}>
                                    {counts[s.value] ?? 0}
                                </span>
                            </button>
                        );
                    })}

                    <details ref={moreRef} className="relative">
                        <summary className="list-none inline-flex select-none items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                            More
                            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                            </svg>
                        </summary>
                        <div className="absolute z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                            <ul role="menu" className="max-h-80 overflow-auto py-1 themed-scrollbar">
                                {SECONDARY.map((s) => (
                                    <li key={s.value} role="none">
                                        <button
                                            role="menuitemradio"
                                            aria-checked={filter === s.value}
                                            onClick={() => pick(s.value)}
                                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-[12px] transition-colors hover:bg-slate-50 ${filter === s.value ? "text-[var(--primary-dark)]" : "text-slate-700"
                                                }`}
                                        >
                                            <span>{s.label}</span>
                                            <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-700">
                                                {counts[s.value] ?? 0}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </details>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <>
                            <OrderSkeleton />
                            <OrderSkeleton />
                        </>
                    ) : filtered.length > 0 ? (
                        filtered.map((order) => <OrderCard key={order._id} order={order} />)
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                                <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-base font-medium text-secondary">No orders found</h3>
                            <p className="mt-1 text-[13px] text-slate-600">Try a different filter above.</p>
                        </div>
                    )}
                </div>
            </div>
        </Container>
    );
}

export default OrderHistory;