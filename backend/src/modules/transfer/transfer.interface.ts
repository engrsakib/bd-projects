import { Types } from "mongoose";
import { IExpenseApplied } from "../purchase/purchase.interface";

export type ITransferItem = {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  qty: number; // মোট কত ট্রান্সফার হচ্ছে

  allocations: [
    {
      lot: Types.ObjectId;
      qty: number; // এই লট থেকে কত গেছে
      unit_cost: number; // লটের unit cost
    },
  ];
};

export type ITransfer = {
  from: Types.ObjectId; // location
  to: Types.ObjectId; // location
  items: ITransferItem[];
  status?: "completed";
  transferBy?: Types.ObjectId;
  expenses_applied?: IExpenseApplied[];
};
