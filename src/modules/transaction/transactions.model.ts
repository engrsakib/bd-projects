import { model, Schema } from "mongoose";
import { ITransaction, TransactionModel } from "./transactions.interface";

const transactionSchema = new Schema<ITransaction>(
  {
    trx_id: { type: String, required: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
    },
    trx_status: { type: String, required: true },
    payment_id: { type: String, required: true },
    payment_date: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "BDT" },
    payment_by: { type: String, required: true },
    message: { type: String, required: false },
    method: { type: String, enum: ["BKASH", "NAGAD"], default: "BKASH" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

const Transactions = model<ITransaction, TransactionModel>(
  "Transactions",
  transactionSchema
);

export default Transactions;
