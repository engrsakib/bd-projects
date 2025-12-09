// src/components/preorder/preorder-checkout-page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Clock,
  Truck,
  ChevronRight,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Cookies from "js-cookie";

import { Container } from "@/components/common/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAppSelector, useAppDispatch } from "@/redux/store";
import {
  selectSavedForLater,
  selectPreOrderCurrent,
  saveForLaterRemove,
} from "@/redux/features/preorder-slice";

import {
  useGetUserInfoQuery,
  useGetProductByIdQuery,
} from "@/redux/api/api-query";

import { API_BASE_URL } from "@/config";
import CashOnDelivery from "@/components/checkout/cod-order-page";

type DeliveryForm = {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
  paymentType: "cod" | "bkash";
};

const initialForm: DeliveryForm = {
  fullName: "",
  phone: "",
  address: "",
  note: "",
  paymentType: "cod",
};

const formatMoney = (n = 0) => `Tk ${Number(n).toLocaleString()}`;

export default function PreOrderCheckoutPage({
  isOrderNow = false,
}: {
  isOrderNow?: boolean;
}) {
  const dispatch = useAppDispatch();

  const saved = useAppSelector(selectSavedForLater);
  const current = useAppSelector(selectPreOrderCurrent);

  const initialSelectedId =
    (isOrderNow && current?.productId)
      ? current.productId
      : current?.productId ?? saved[0]?.productId ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  const selectedSaved = useMemo(() => {
    const found = saved.find((s) => s.productId === selectedId);
    if (found) return found;
    if (current && current.productId === selectedId) {
      // Create an object compatible enough with SavedForLaterItem
      return {
        id: current.id ?? "current",
        productId: current.productId,
        variantId: current.variantId,
        attributes: current.attributes ?? {},
        name: current.name,
        image: current.image,
        priceSnapshot: current.priceSnapshot,
      } as any;
    }
    return null;
  }, [saved, selectedId, current]);

  const { data: productRes, isLoading: productLoading } =
    useGetProductByIdQuery(selectedId!, {
      skip: !selectedId,
    });
  const product = productRes?.data || null;

  const { data: userInfo } = useGetUserInfoQuery({});

  const [form, setForm] = useState<DeliveryForm>(initialForm);
  const [placing, setPlacing] = useState(false);

  const [orderResponse, setOrderResponse] = useState<any | null>(null);

  useEffect(() => {
    if (userInfo?.data) {
      setForm((prev) => ({
        ...prev,
        fullName: userInfo.data.name ?? "",
        phone: userInfo.data.phone_number ?? "",
      }));
    }
  }, [userInfo]);

  useEffect(() => {
    if (isOrderNow && current?.productId) {
      setSelectedId(current.productId);
      return;
    }

    if (!selectedId) {
      if (current?.productId) {
        setSelectedId(current.productId);
      } else if (saved.length > 0) {
        setSelectedId(saved[0].productId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrderNow, current?.productId]);

  useEffect(() => {
    if (!selectedId) {
      if (isOrderNow && current?.productId) {
        setSelectedId(current.productId);
        return;
      }
      if (saved.length > 0) setSelectedId(saved[0].productId);
      return;
    }

    const stillExistsInSaved = saved.some((s) => s.productId === selectedId);
    if (!stillExistsInSaved) {
      if (isOrderNow && current?.productId) {
        setSelectedId(current.productId);
      } else {
        setSelectedId(saved[0]?.productId ?? null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.length]);

  const variant = useMemo(() => {
    if (!product || !selectedSaved?.variantId) return null;
    return (
      (product.variants || []).find(
        (v: any) => v._id === selectedSaved.variantId
      ) ?? null
    );
  }, [product, selectedSaved?.variantId]);

  const unitPrice =
    variant?.sale_price ??
    variant?.regular_price ??
    (selectedSaved?.priceSnapshot ?? current?.priceSnapshot ?? 0);
  const qty = 1;
  const total = unitPrice * qty;

  const preMeta = product?.pre_order_product || {};
  const advancePct = Number(preMeta?.advance_payment_percentage ?? 0);
  const expectedDays = preMeta?.expected_delivery_time;

  const advanceAmount = Math.round((total * advancePct) / 100);
  const remainingAmount = total - advanceAmount;

  const handleChange = (k: keyof DeliveryForm, v: string | "cod" | "bkash") => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const validate = () => {
    if (!selectedId) {
      toast.error("Pick a pre-order item first.");
      return false;
    }
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Please fill all required fields.");
      return false;
    }

    // allow ordering when selection comes from current (even if it's not in saved list)
    if (current && current.productId && current.productId !== selectedId) {
      toast.error(
        "You already have a pre-order reserved. You can only pre-order one item at a time."
      );
      return false;
    }
    return true;
  };

  const placePreOrder = async () => {
    if (!validate()) return;
    setPlacing(true);

    try {
      const productsBody = [
        {
          product: product?._id,
          variant: variant?._id,
          quantity: qty,
          price: unitPrice,
          attributes: selectedSaved?.attributes || current?.attributes || {},
        },
      ];

      const payload = {
        customer_name: form.fullName,
        customer_number: form.phone,
        customer_email: " ",
        customer_secondary_number: "",
        orders_by: userInfo ? "user" : "guest",
        products: productsBody,
        delivery_address: {
          division: "",
          district: "",
          thana: "",
          local_address: form.address,
          notes: form.note || " ",
        },
        payment_type: form.paymentType,
      };

      const res = await fetch(`${API_BASE_URL}/pre/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: Cookies.get("cbd_atkn_91f2a") ?? "",
          "x-refresh-token": Cookies.get("cbd_rtkn_7c4d1") ?? "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message || `Failed to place pre-order (${res.status})`
        );
      }

      const data = await res.json();

      setOrderResponse(data);
      toast.success("Your pre-order has been placed successfully! 🎉");

      if (form.paymentType === "bkash" && data?.data?.payment_url) {
        window.location.href = data.data.payment_url;
        return;
      }
    } catch (e: any) {
      toast.error(e?.message || "Error placing pre-order");
    } finally {
      setPlacing(false);
    }
  };

  const handleRemoveSaved = (id: string, productId: string) => {
    const newSaved = saved.filter((i) => i.id !== id);

    dispatch(saveForLaterRemove({ id }));

    const stillHasSelected = newSaved.some((i) => i.productId === selectedId);
    if (!stillHasSelected) {
      if (isOrderNow && current?.productId) {
        setSelectedId(current.productId);
      } else {
        setSelectedId(newSaved[0]?.productId ?? null);
      }
    }

    toast.success("Removed saved item.");
  };

  if (orderResponse) {
    return <CashOnDelivery isPreOrder orderResponse={orderResponse} />;
  }

  return (
    <div className="bg-gradient-to-b from-white via-[#faf7fb] to-white">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: Saved items picker */}
          <div className="md:col-span-1">
            <Card className="rounded-lg border-0 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-secondary">
                  Saved Pre-Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {saved.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    No saved pre-order items. Go pick something to reserve ✨
                  </div>
                ) : (
                  saved.map((s) => {
                    const active = s.productId === selectedId;
                    return (
                      <div key={s.id} className="flex items-start gap-2">
                        <motion.div
                          onClick={() => setSelectedId(s.productId)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={[
                            "flex-1 cursor-pointer flex items-center gap-3 rounded-lg border p-2 text-left transition",
                            active
                              ? "border-primary/50 bg-primary/5"
                              : "border-gray-200 hover:border-primary/30",
                          ].join(" ")}
                          aria-pressed={active}
                        >
                          <Image
                            src={s.image || "/placeholder.svg"}
                            alt={s.name || "Saved"}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-secondary line-clamp-2">
                              {s.name || "Saved item"}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(s.attributes || {}).map(
                                ([k, v]) => (
                                  <span
                                    key={k}
                                    className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                                  >
                                    {k}: {String(v)}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                          {active ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSaved(s.id, s.productId)}
                            className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded  p-2 text-sm hover:bg-gray-50"
                            title="Remove saved item"
                            aria-label={`Remove ${s.name || "saved item"}`}
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" />
                          </button>
                        </motion.div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* MIDDLE: Delivery form */}
          <div className="md:col-span-1">
            <Card className="rounded-lg border-0 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-secondary">
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-1 block text-xs text-gray-500">
                    Full Name *
                  </Label>
                  <Input
                    className="h-11 rounded-lg focus-visible:ring-primary"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-gray-500">
                    Phone Number *
                  </Label>
                  <Input
                    className="h-11 rounded-lg focus-visible:ring-primary"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-gray-500">
                    Address *
                  </Label>
                  <Input
                    className="h-11 rounded-lg focus-visible:ring-primary"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="House / Road / Area"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-gray-500">
                    Order Note
                  </Label>
                  <Textarea
                    rows={2}
                    className="rounded-lg focus-visible:ring-primary"
                    value={form.note}
                    onChange={(e) => handleChange("note", e.target.value)}
                    placeholder="Any special instruction (optional)"
                  />
                </div>

                <div>
                  <Label className="mb-1 block text-xs text-gray-500">
                    Payment Method
                  </Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("paymentType", "cod")}
                      className={[
                        "rounded-lg px-3 py-2 text-sm border transition",
                        form.paymentType === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200",
                      ].join(" ")}
                    >
                      Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("paymentType", "bkash")}
                      className={[
                        "rounded-lg px-3 py-2 text-sm border transition",
                        form.paymentType === "bkash"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200",
                      ].join(" ")}
                    >
                      bKash
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Selected summary */}
          <div className="md:col-span-1">
            <Card className="rounded-lg border-none shadow-none sticky top-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-secondary">
                    Pre-Order Summary
                  </CardTitle>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {!selectedId ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    Select an item from the left to continue.
                  </div>
                ) : productLoading ? (
                  <Skeleton className="h-[180px] w-full rounded-lg" />
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 rounded-lg border border-gray-100 p-3 mb-4"
                    >
                      <Image
                        src={product?.thumbnail || selectedSaved?.image || "/placeholder.svg"}
                        alt={product?.name || selectedSaved?.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-secondary line-clamp-2">
                          {product?.name || selectedSaved?.name}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          Expected dispatch: {expectedDays ?? "--"} days
                        </div>
                        <div className="text-xs text-gray-500">Qty: 1</div>
                      </div>
                    </motion.div>

                    {/* breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Price</span>
                        <span className="font-medium">
                          {formatMoney(unitPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          {formatMoney(total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Advance ({advancePct}%)
                        </span>
                        <span className="font-medium text-primary">
                          {formatMoney(advanceAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Remaining (on delivery)
                        </span>
                        <span className="font-medium">
                          {formatMoney(remainingAmount)}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base font-medium text-secondary">
                        <span>Pay Now</span>
                        <span>{formatMoney(advanceAmount)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={placePreOrder}
                      disabled={
                        placing ||
                        ((current &&
                          current.productId &&
                          current.productId !== selectedId) as any)
                      }
                      className="mt-5 w-full rounded-lg bg-primary py-5 text-base font-medium text-white shadow-lg transition hover:translate-y-[-1px] hover:bg-primary-mid"
                    >
                      {placing ? "Processing..." : "Confirm Pre-Order"}
                    </Button>

                    {/* small helper row */}
                    <div className="mt-3 flex items-center gap-2 text-[12px] text-gray-600">
                      <Truck className="h-4 w-4" />
                      <span>
                        Delivery charges (if any) will be added at dispatch.
                      </span>
                    </div>

                    {current &&
                    current.productId &&
                    current.productId !== selectedId ? (
                      <div className="mt-3 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                        You already have a reserved pre-order. Only one
                        pre-order is allowed at a time.
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
