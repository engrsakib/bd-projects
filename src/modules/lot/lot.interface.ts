import { Types } from "mongoose";

export type ILot = {
  _id?: Types.ObjectId; // কোন ভ্যারিয়েন্ট
  stock: Types.ObjectId; // কোন ভ্যারিয়েন্ট
  variant: Types.ObjectId; // কোন ভ্যারিয়েন্ট
  product: Types.ObjectId; // (রিপোর্টিং/জয়েনের সুবিধা)
  location: Types.ObjectId; // কোন আউটলেটে lot আছে
  lot_number: string; // ইনভয়েস/নিজস্ব সিরিয়াল (unique per variant+outlet)
  received_at: Date; // FIFO-র key
  cost_per_unit: number; // landed/unit cost (expense-apportioned)
  qty_total: number; // মোট কত এসেছিল
  qty_available: number; // এখন কত বাকি
  source: {
    // এই lot কোথা থেকে এলো
    type: "purchase" | "transfer_in" | "return" | "adjustment";
    ref_id: Types.ObjectId; // PO/Transfer/SaleReturn ইত্যাদির আইডি
  };
  expiry_date?: Date | null; // থাকলে মেয়াদ

  status?: "active" | "expired" | "quarantined" | "closed";
  notes?: string;
  createdBy: Types.ObjectId | string | undefined;
};
