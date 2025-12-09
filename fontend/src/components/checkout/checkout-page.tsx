"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

import { bangladeshDivisions } from "@/lib/data/bangladesh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "../common/container";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/config";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  removeItem as removeLocalItem,
  updateQty as updateLocalQty,
  selectCartItems,
} from "@/redux/features/cart-slice";
import {
  useGetProductsByIdsQuery,
  useGetUserInfoQuery,
} from "@/redux/api/api-query";
import type { Product, ProductVariant } from "@/types/product";
import SuggestionDropdown from "./SuggestDropdown";
import CashOnDelivery from "./cod-order-page";
type PaymentMethod = "bkash" | "cod";

type DeliveryForm = {
  fullName: string;
  phone: string;               // required
  secondaryPhone?: string;     // optional
  division: string;
  district: string;
  local_address: string;
  order_note: string;
  payment_type: PaymentMethod;
};

type DistrictShape = { জেলা: string; উপজেলা: string[] };
type BDDataShape = { [division: string]: DistrictShape[] };

const initialForm: DeliveryForm = {
  fullName: "",
  phone: "",
  secondaryPhone: "",
  division: "",
  district: "",
  local_address: "",
  order_note: "",
  payment_type: "bkash",
};

const normalize = (s: string) =>
  (s || "").toLowerCase().trim().replace(/\s+/g, " ");

const isDhakaDistrict = (district: string) => {
  const d = normalize(district);
  return d === "ঢাকা" || d === "dhaka";
};

const isGazipurDistrict = (district: string) => {
  const d = normalize(district);
  return d === "গাজীপুর" || d === "গাজিপুর" || d === "gazipur";
};

const parseList = (v?: string) => (v ?? "").split(",").map((s) => s.toLowerCase().trim().replace(/\s+/g, " ")).filter(Boolean);

const LOCAL_AREAS = parseList(process.env.NEXT_PUBLIC_LOCAL_AREAS);
const CITY_AREAS = parseList(process.env.NEXT_PUBLIC_CITY_AREAS);

const LOCAL_DELIVERY_CHARGE = Number(process.env.NEXT_PUBLIC_LOCAL_DELIVERY_CHARGE ?? "70");
const CITY_DELIVERY_CHARGE = Number(process.env.NEXT_PUBLIC_CITY_DELIVERY_CHARGE ?? "100");
const OUTSIDE_DELIVERY_CHARGE = Number(process.env.NEXT_PUBLIC_OUTSIDE_DELIVERY_CHARGE ?? "150");

const isInList = (district: string, list: string[]) => list.includes(normalize(district));


const CheckoutPage = () => {
  const dispatch = useAppDispatch();
  const lines = useAppSelector(selectCartItems);
  const productIds = useMemo(
    () => Array.from(new Set(lines.map((l) => l.productId))),
    [lines]
  );
  const { data: userInfo, isLoading } = useGetUserInfoQuery({});

  const {
    data: productsRes,
    isLoading: cartLoading,
    isFetching,
  } = useGetProductsByIdsQuery(productIds, {
    skip: productIds.length === 0,
  });

  const productMap = useMemo(() => {
    const arr: Product[] = (productsRes as any)?.data ?? [];
    const map = new Map<string, Product>();
    for (const p of arr) map.set(p._id, p);
    return map;
  }, [productsRes]);

  useEffect(() => {
    if (!productsRes || productIds.length === 0) return;
    const toRemove = new Set<string>();
    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product) {
        toRemove.add(line.id);
        continue;
      }
      const variant = (product.variants || []).find(
        (v) => v._id === line.variantId
      );
      if (!variant) toRemove.add(line.id);
    }
    if (toRemove.size > 0) {
      toast.error(
        "Some items are no longer available and were removed from your cart."
      );
      toRemove.forEach((id) => dispatch(removeLocalItem({ id })));
    }
  }, [productsRes, productIds.length, lines, productMap, dispatch]);

  const items = useMemo(() => {
    const out: Array<{
      id: string;
      product: Product;
      variant: ProductVariant;
      attributes: Record<string, string>;
      quantity: number;
      price: number; // unit
    }> = [];
    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product) continue;
      const variant = (product.variants || []).find(
        (v) => v._id === line.variantId
      );
      if (!variant) continue;
      out.push({
        id: line.id,
        product,
        variant,
        attributes: line.attributes,
        quantity: line.quantity,
        price: variant.sale_price ?? line.priceSnapshot ?? 0,
      });
    }
    return out;
  }, [lines, productMap]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.price * it.quantity, 0),
    [items]
  );

  const [form, setForm] = useState<DeliveryForm>(initialForm);
  const [bdData, setBdData] = useState<BDDataShape>(
    bangladeshDivisions as unknown as BDDataShape
  );
  const [orderRes, setOrderRes] = useState<any>(null);

  useEffect(() => {
    if (userInfo) {
      setForm((prev) => ({
        ...prev,
        fullName: userInfo?.data?.name ?? "",
        phone: userInfo?.data?.phone_number ?? "",
      }));
    }
  }, [userInfo, isLoading]);

  const divisions = useMemo(() => Object.keys(bdData), [bdData]);
  const districts = useMemo(() => {
    if (!form.division) return [] as string[];
    return bdData[form.division]?.map((d) => d.জেলা) ?? [];
  }, [form.division, bdData]);

  const delivery_charge = useMemo(() => {
    if (!form.district) return 0;
    if (isInList(form.district, LOCAL_AREAS)) return LOCAL_DELIVERY_CHARGE;
    if (isInList(form.district, CITY_AREAS)) return CITY_DELIVERY_CHARGE;
    return OUTSIDE_DELIVERY_CHARGE;
  }, [form.district]);

  const discounts = 0;
  const tax = 0;
  const grandTotal = subtotal + delivery_charge + tax - discounts;

  const setField = (k: keyof DeliveryForm, v: string) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "division") {
        next.district = "";
      }
      return next;
    });
  };

  const createDivision = (name: string) =>
    setBdData((prev) => (prev[name] ? prev : { ...prev, [name]: [] }));
  const createDistrict = (divisionName: string, districtName: string) =>
    setBdData((prev) => {
      const list = prev[divisionName] ?? [];
      if (
        list.some(
          (d) => d.জেলা.toLowerCase() === districtName.toLowerCase()
        )
      )
        return prev;
      return {
        ...prev,
        [divisionName]: [...list, { জেলা: districtName, উপজেলা: [] }],
      };
    });

  const changeQty = (lineId: string, newQty: number) => {
    if (newQty < 1) return;
    dispatch(updateLocalQty({ id: lineId, quantity: newQty }));
  };
  const removeItem = (lineId: string) => {
    dispatch(removeLocalItem({ id: lineId }));
  };

  const validate = () => {
    const required: (keyof DeliveryForm)[] = [
      "fullName",
      "phone",
      "division",
      "district",
      "local_address",
    ];
    for (const k of required) {
      if (!String(form[k] || "").trim()) {
        toast.error(`${k.replace("_", " ")} is required`);
        return false;
      }
    }
    // phone length basic check
    if (form.phone.replace(/\D/g, "").length < 11) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    // optional secondary phone check (only if present)
    if (form.secondaryPhone && form.secondaryPhone.replace(/\D/g, "").length < 11) {
      toast.error("Please enter a valid secondary phone number");
      return false;
    }
    if (!items.length) {
      toast.error("Your cart is empty");
      return false;
    }
    return true;
  };

  const [orderLoading, setOrderLoading] = useState(false);
  const placeOrder = async () => {
    if (!validate()) return;
    setOrderLoading(true);

    const productsBody = items.map((it) => ({
      product: it.product._id,
      variant: it.variant._id,
      quantity: it.quantity,
      price: it.price, // unit price
      attributes: it.attributes,
    }));

    const orderPayload = {
      customer_name: form.fullName,
      customer_number: form.phone,
      orders_by: userInfo ? "user" : undefined,
      user_id: userInfo?.data?._id || undefined,
      customer_secondary_number: form.secondaryPhone?.trim() || "",
      products: productsBody,
      delivery_address: {
        division: form.division,
        district: form.district,
        local_address: form.local_address,
        notes: form.order_note || " ",
        delivery_charge,
      },
      payment_type: "cod" as const, // "bkash" | "cod"
    };

    try {
      const res = await fetch(API_BASE_URL + "/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: Cookies.get("cbd_atkn_91f2a") ?? "",
          "x-refresh-token": Cookies.get("cbd_rtkn_7c4d1") ?? "",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Order failed (${res.status})`);
      }

      const data = await res.json();
      setOrderRes(data);
      toast.success("Order placed successfully!");
      if (data?.data?.payment_url) window.location.href = data.data.payment_url;
    } catch (e: any) {
      toast.error(e?.message || "Failed to place order");
    } finally {
      setOrderLoading(false);
    }
  };

  if (orderRes) {
    return <CashOnDelivery orderResponse={orderRes} />;
  }

  return (
    <div className="bg-gradient-to-b from-white via-[#faf7fb] to-white">
      <Container className=" py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left: Delivery Info */}
          <div className="md:col-span-2 ">
            <Card className="rounded-lg p-0 md:p-4 shadow-none border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium  text-secondary">
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0 md:p-4">
                {cartLoading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg md:col-span-2" />
                  </div>
                ) : (
                  <>
                    <div className="">
                      <div>
                        <Label className="mb-2 block text-gray-500 text-xs">
                          Full Name *
                        </Label>
                        <Input
                          className="h-12 rounded-lg focus-visible:ring-primary"
                          value={form.fullName}
                          onChange={(e) => setField("fullName", e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label className="mb-2 block text-gray-500 text-xs">
                          Phone Number *
                        </Label>
                        <Input
                          type="tel"
                          className="h-12 rounded-lg focus-visible:ring-primary"
                          value={form.phone}
                          onChange={(e) => setField("phone", e.target.value)}
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block text-gray-500 text-xs">
                          Secondary Phone (optional)
                        </Label>
                        <Input
                          type="tel"
                          className="h-12 rounded-lg focus-visible:ring-primary"
                          value={form.secondaryPhone || ""}
                          onChange={(e) =>
                            setField("secondaryPhone", e.target.value)
                          }
                          placeholder="Alternate contact number"
                        />
                      </div>
                    </div>

                    {/* Division / District */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label className="mb-2 block text-gray-500 text-xs">
                          Division *
                        </Label>
                        <SuggestionDropdown
                          value={form.division}
                          onChange={(v) => setField("division", v)}
                          options={divisions}
                          placeholder="Select or add Division"
                          required
                          creatable
                          onCreate={(name) => {
                            createDivision(name);
                            setField("division", name);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block text-gray-500 text-xs">
                          District *
                        </Label>
                        <SuggestionDropdown
                          value={form.district}
                          onChange={(v) => setField("district", v)}
                          options={districts}
                          placeholder="Select or add District"
                          disabled={!form.division}
                          required
                          creatable
                          onCreate={(name) => {
                            if (!form.division)
                              return toast.error("Select a division first");
                            createDistrict(form.division, name);
                            setField("district", name);
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block text-gray-500 text-xs">
                        Local Address *
                      </Label>
                      <Input
                        className="h-12 rounded-lg focus-visible:ring-primary"
                        placeholder="House / Road / Area"
                        value={form.local_address}
                        onChange={(e) =>
                          setField("local_address", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block text-gray-500 text-xs">
                        Order Note
                      </Label>
                      <Textarea
                        className="rounded-lg focus-visible:ring-primary"
                        rows={2}
                        placeholder="Any special instruction (optional)"
                        value={form.order_note}
                        onChange={(e) => setField("order_note", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-6 rounded-lg border-none shadow-none ">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-secondary">
                    Order Summary
                  </CardTitle>
                  <Truck className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Cart items */}
                <div className="space-y-3">
                  {cartLoading ? (
                    <>
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className="flex gap-3 rounded-lg border border-gray-100 p-3"
                        >
                          <Skeleton className="h-[72px] w-[72px] rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/2" />
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-8 w-24" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : items.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                      Your cart is empty.
                    </div>
                  ) : (
                    items.map((it) => (
                      <motion.div
                        key={it.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 rounded-lg border border-gray-100 p-3"
                      >
                        <Image
                          src={it.product.thumbnail || "/placeholder.svg"}
                          alt={it.product.name}
                          width={72}
                          height={72}
                          className="h-[72px] w-[72px] rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-secondary">
                            {it.product.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {Object.entries(it.attributes || {}).map(
                              ([k, v]) => (
                                <span
                                  key={k}
                                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                >
                                  {k}: {String(v).replace(/,/g, ", ")}
                                </span>
                              )
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => changeQty(it.id, it.quantity - 1)}
                                className="rounded-md border border-gray-300 p-1 hover:bg-gray-50 disabled:opacity-50"
                                aria-label="Decrease quantity"
                                disabled={it.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center text-sm">
                                {it.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQty(it.id, it.quantity + 1)}
                                className="rounded-md border border-gray-300 p-1 hover:bg-gray-50 disabled:opacity-50"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-sm font-medium text-secondary">
                              Tk {(it.price * it.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="self-start rounded-md p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      Tk {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charge</span>
                    <span className="font-medium">
                      Tk {delivery_charge.toLocaleString()}{" "}
                      {isFetching ? "(updating…)" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discounts</span>
                    <span className="font-medium">
                      -Tk {discounts.toLocaleString()}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-medium text-secondary">
                    <span>Total</span>
                    <span>Tk {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={placeOrder}
                  disabled={cartLoading || !items.length || orderLoading}
                  className="mt-5 w-full rounded-lg bg-primary py-6 text-base font-medium text-white shadow-lg transition hover:translate-y-[-1px] hover:bg-primary-mid"
                >
                  {orderLoading ? "Placing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CheckoutPage;
