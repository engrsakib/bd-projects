"use client";
import Image from "next/image";
import {
  CheckCircle,
  XCircle,
  CreditCard,
  Package,
  User,
  MapPin,
  Hash,
  Calendar,
  ShoppingBag,
  Phone,
  MapPinIcon,
} from "lucide-react";
import Link from "next/link";

interface Transaction {
  trx_id: string;
  trx_status: string;
  payment_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_by: string;
  method: string;
}

interface Product {
  product: {
    _id: string;
    name: string;
    thumbnail: string;
  };
  total_quantity: number;
  selected_variant: {
    attribute_values: {
      Size: string;
      Color: string;
    };
    sku: string;
  };
  total_price: number;
}

interface Order {
  _id: string;
  order_serial_id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  products: Product[];
  delivery_address: {
    division: string;
    district: string;
    thana: string;
    address: string;
  };
  sub_total: number;
  delivery_charge: number;
  total_discount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  order_date: string;
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  data: {
    transaction: Transaction;
    order: Order;
  };
}

const PaymentVerify = ({ data }: { data: ApiResponse }) => {
  if (!data?.success || !data?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl  p-8 w-full max-w-md transform transition-all duration-300 hover:scale-105">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-red-100 rounded-full p-4 mb-6">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-medium text-red-600 mb-3">
              Payment Failed
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Transaction could not be processed. Please try again or contact
              support.
            </p>
            <button className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { transaction, order } = data.data;

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 ">
          <div className="flex items-center justify-center text-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-medium text-green-800 mb-2">
                Payment Successful!
              </h1>
              <p className="text-green-700 text-lg">
                Your order has been placed successfully
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg  overflow-hidden">
            <div className="bg-secondary  px-6 py-5">
              <h2 className="text-lg font-medium text-white flex items-center">
                <CreditCard className="w-6 h-6 mr-3" />
                Transaction Details
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">
                  Transaction ID
                </span>
                <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                  <Hash className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-mono text-sm font-semibold text-secondary">
                    {transaction.trx_id}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Payment ID</span>
                <span className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-1 rounded">
                  {transaction.payment_id}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Status</span>
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                  {transaction.trx_status.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Method</span>
                <span className="bg-secondary text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {transaction.method}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Amount</span>
                <div className="flex items-center">
                  <span className="text-2xl font-medium text-[#EFBB29]">
                    {transaction.amount} {transaction.currency}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 font-medium">Date</span>
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>
                    {new Date(transaction.payment_date).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#EFBB29] to-[#f4c542] px-6 py-5">
              <h2 className="text-lg font-medium text-secondary flex items-center">
                <Package className="w-6 h-6 mr-3" />
                Order Summary
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Order ID</span>
                <span className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg font-semibold">
                  #{order.order_serial_id}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Invoice</span>
                <span className="font-mono text-sm text-gray-800 bg-gray-50 px-3 py-1 rounded">
                  {order.invoice_number}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Status</span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                  {order.status}
                </span>
              </div>

              <div className="border-t-2 border-gray-200 pt-4 mt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">{order.sub_total} BDT</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">
                      {order.delivery_charge === 0
                        ? "FREE"
                        : `${order.delivery_charge} BDT`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Discount</span>
                    <span className="font-semibold text-green-600">
                      -{order.total_discount} BDT
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3 mt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-gray-800">Total</span>
                      <span className="text-[#EFBB29]">
                        {order.total_amount} BDT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg   overflow-hidden">
            <div className="bg-secondary px-6 py-5">
              <h2 className="text-lg font-medium text-white flex items-center">
                <User className="w-6 h-6 mr-3" />
                Customer Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="text-gray-500 text-sm font-medium block mb-1">
                  Full Name
                </span>
                <p className="text-lg font-semibold text-gray-800">
                  {order.customer_name}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className="text-gray-500 text-sm font-medium block mb-1">
                  Phone Number
                </span>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <p className="text-lg font-semibold text-gray-800">
                    {order.customer_phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md  overflow-hidden">
            <div className="bg-primary px-6 py-5">
              <h2 className="text-lg font-medium text-secondary flex items-center">
                <MapPin className="w-6 h-6 mr-3" />
                Delivery Address
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-gray-800 text-lg">
                  {order.delivery_address.address}
                </p>
                <p className="text-gray-600 flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  {order.delivery_address.thana},{" "}
                  {order.delivery_address.district}
                </p>
                <p className="text-gray-600 font-medium">
                  {order.delivery_address.division}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md overflow-hidden">
          <div className="bg-gradient-to-r from-secondary to-[#034a5c] px-6 py-5">
            <h2 className="text-lg font-medium text-white flex items-center">
              <ShoppingBag className="w-6 h-6 mr-3" />
              Ordered Items ({order.products.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {order.products.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center space-x-6">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.product?.thumbnail || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded-xl shadow-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg text-secondary mb-2">
                        {item.product.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="bg-white border border-gray-300 px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                          Size: {item.selected_variant.attribute_values.Size}
                        </span>
                        <span className="bg-white border border-gray-300 px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                          Color: {item.selected_variant.attribute_values.Color}
                        </span>
                        <span className="bg-[#EFBB29] text-secondary px-3 py-1 rounded-full text-xs font-medium">
                          Qty: {item.total_quantity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded inline-block">
                        SKU: {item.selected_variant.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-medium text-[#EFBB29]">
                        {item.total_price} BDT
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.total_price / item.total_quantity} BDT each
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href={"/"} aria-label="Home">
            <button className="border-2 border-gray-300 bg-primary hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold transition-colors duration-200">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerify;
