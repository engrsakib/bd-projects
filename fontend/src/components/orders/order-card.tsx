"use client";

// ===============================
// components/orders/order-card.tsx
// Clean, compact, professional UI with tiny type & CSS-only micro-animations
// ===============================

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Clock3,
  Truck,
  RefreshCcw,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ArrowLeftRight,
  PackageOpen,
  Boxes,
} from "lucide-react";
import { ORDER_STATUS } from "@/types";


interface OrderCardProps {
  order: {
    _id: string;
    order_id: number;
    invoice_number: string;
    customer_name: string;
    customer_number: string;
    total_amount: number;
    order_status: string;
    order_at: string;
    items: Array<{
      product: { name: string; thumbnail: string };
      quantity: number;
      price: number;
    }>;
  };
}

const formatBDT = (value: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace("BDT", "৳");

const labelFromStatus = (s: string) =>
  s
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

// one place to style status: color, icon, chip
const statusMeta: Record<string, {
  label: string;
  bg: string;
  text: string;
  dot: string;
  ring: string;
  icon: any;
}> = {
  [ORDER_STATUS.PENDING]: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-100",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.PLACED]: {
    label: "Placed",
    bg: "bg-slate-50",
    text: "text-slate-700",
    dot: "bg-slate-500",
    ring: "ring-slate-100",
    icon: <Boxes className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.ACCEPTED]: {
    label: "Accepted",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    ring: "ring-indigo-100",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.SHIPPED]: {
    label: "Shipped",
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
    ring: "ring-sky-100",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.HANDED_OVER_TO_COURIER]: {
    label: "Handed To Courier",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    ring: "ring-blue-100",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.IN_TRANSIT]: {
    label: "In Transit",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    ring: "ring-blue-100",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.PARTIAL_DELIVERED]: {
    label: "Partial Delivered",
    bg: "bg-teal-50",
    text: "text-teal-700",
    dot: "bg-teal-500",
    ring: "ring-teal-100",
    icon: <PackageOpen className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.DELIVERED]: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-100",
    icon: <PackageCheck className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.PENDING_RETURN]: {
    label: "Pending Return",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    ring: "ring-orange-100",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.RETURNED]: {
    label: "Returned",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    ring: "ring-rose-100",
    icon: <RefreshCcw className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.EXCHANGE_REQUESTED]: {
    label: "Exchange Requested",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
    ring: "ring-violet-100",
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.EXCHANGED]: {
    label: "Exchanged",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
    ring: "ring-violet-100",
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.FAILED]: {
    label: "Failed",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    ring: "ring-red-100",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Cancelled",
    bg: "bg-zinc-50",
    text: "text-zinc-700",
    dot: "bg-zinc-500",
    ring: "ring-zinc-100",
    icon: <Ban className="h-3.5 w-3.5" />,
  },
};

const OrderCard =({ order }: OrderCardProps)=> {
  const [expanded, setExpanded] = useState(false);

  const date = useMemo(
    () =>
      new Date(order.order_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [order.order_at]
  );

  const meta = statusMeta[order.order_status] ?? {
    label: labelFromStatus(order.order_status),
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-500",
    ring: "ring-gray-100",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  };

  const totalItems = order.items.length;
  const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <section
      className="group rounded-xl border border-slate-200 border-t-primary border-t-2 bg-white  transition-[box-shadow,transform] duration-300 hover:-translate-y-[1px] "
      aria-label={`Order ${order.order_id}`}
    >
      {/* <div className="h-0.5 w-full ml-2 mr-4 bg-gradient-to-r from-fuchsia-200 via-fuchsia-300 to-fuchsia-200 opacity-60" /> */}

      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left */}
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-slate-900 tracking-tight">Order #{order.order_id}</h3>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{order.invoice_number}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border border-transparent ${meta.bg} ${meta.ring} px-2.5 py-1 text-[10px] font-medium ${meta.text} ring-1 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200`}
                title={meta.label}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} motion-safe:animate-pulse [animation-duration:2.2s]`} />
                {meta.icon}
                {meta.label}
              </span>
            </div>

            {/* Info grid */}
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Customer</dt>
                <dd className="mt-1 text-xs font-medium text-slate-900 truncate">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Phone</dt>
                <dd className="mt-1 text-xs font-medium text-slate-900">{order.customer_number}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Date</dt>
                <dd className="mt-1 text-xs font-medium text-slate-900">{date}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Items / Qty</dt>
                <dd className="mt-1 text-xs font-medium text-slate-900">{totalItems} / {totalQty}</dd>
              </div>
            </dl>
          </div>

          {/* Right */}
          <div className="text-right sm:min-w-[160px]">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Total Amount</p>
            <p className="text-lg font-bold text-fuchsia-500 leading-tight">{formatBDT(order.total_amount)}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* Toggle */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`order-items-${order._id}`}
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
      >
        <span>Order items ({totalItems})</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Items */}
      <div id={`order-items-${order._id}`} hidden={!expanded} className="border-t border-slate-200 bg-slate-50">
        <ul className="divide-y divide-slate-200">
          {order.items.map((item, idx) => (
            <li key={idx} className="grid grid-cols-12 gap-3 p-4 sm:gap-4">
              <div className="col-span-3 sm:col-span-2">
                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white motion-safe:transition-transform motion-safe:duration-200 group-hover:scale-[1.02]">
                  <Image
                    src={item.product.thumbnail || "/placeholder.svg"}
                    alt={item.product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="col-span-9 flex min-w-0 items-center justify-between sm:col-span-10">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-900">{item.product.name}</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Qty <span className="font-medium text-slate-900">{item.quantity}</span>
                    <span className="mx-2">•</span>
                    Price <span className="font-medium text-slate-900">{formatBDT(item.price)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-fuchsia-500">{formatBDT(item.quantity * item.price)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default OrderCard;
