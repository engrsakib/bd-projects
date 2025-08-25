import { Types } from "mongoose";

export type ILot = {
  _id: Types.ObjectId; // কোন ভ্যারিয়েন্ট
  stock: Types.ObjectId; // কোন ভ্যারিয়েন্ট
  variant: Types.ObjectId; // কোন ভ্যারিয়েন্ট
  product: Types.ObjectId; // (রিপোর্টিং/জয়েনের সুবিধা)
  location: Types.ObjectId; // কোন আউটলেটে lot আছে
  source: {
    // এই lot কোথা থেকে এলো
    type: "purchase" | "transfer_in" | "return" | "adjustment";
    ref_id: Types.ObjectId; // PO/Transfer/SaleReturn ইত্যাদির আইডি
  };
  lot_number: string; // ইনভয়েস/নিজস্ব সিরিয়াল (unique per variant+outlet)
  received_at: Date; // FIFO-র key
  expiry_date: Date | null; // থাকলে মেয়াদ
  cost_per_unit: number; // landed/unit cost (expense-apportioned)
  qty_total: number; // মোট কত এসেছিল
  qty_available: number; // এখন কত বাকি

  status: "active" | "expired" | "quarantined" | "closed";
  notes: string;
  createdBy: Types.ObjectId;
};

export type IStock = {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  location: Types.ObjectId;
  available_quantity: number;
  total_sold?: number;
  qty_reserved: number; // cart/reservation (optional)
};
