import { Types } from "mongoose";

export type ILot = {
  _id?: Types.ObjectId;
  stock: Types.ObjectId;
  variant: Types.ObjectId;
  product: Types.ObjectId;
  location: Types.ObjectId;
  lot_number: string;
  received_at: Date;
  cost_per_unit: number;
  qty_total: number;
  qty_available: number;
  qty_reserved?: number;
  source: {
    type: "purchase" | "transfer_in" | "return" | "adjustment";
    ref_id: Types.ObjectId | string;
  };
  expiry_date?: Date | null;

  status?: "active" | "expired" | "quarantined" | "closed";
  notes?: string;
  createdBy: Types.ObjectId | string | undefined;
};
