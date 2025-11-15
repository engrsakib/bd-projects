import { Document, Model, Types } from "mongoose";
import { ParsedQs } from "qs";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request, Response } from "express";
import { IUser } from "../user/user.interface";
import { IOrder } from "../order/order.interface";

export type ITransaction = {
  trx_id: string;
  user?: IUser | Types.ObjectId | null; // for guest user user_id will null
  trx_status: string;
  order: IOrder | Types.ObjectId | string | null;
  payment_id: string;
  payment_date: Date;
  amount: number;
  currency: string;
  payment_by: string | Types.ObjectId | null;
  message?: string;
  method: "BKASH" | "NAGAD";
  _id?: Types.ObjectId;
} & Document;

export interface Payload {
  paymentID?: string | ParsedQs | (string | ParsedQs)[] | undefined;
  status?: string | ParsedQs | (string | ParsedQs)[] | undefined;
  order_id: string | ParsedQs | (string | ParsedQs)[] | undefined;
}

export type TransactionModel = Model<ITransaction, Record<string, unknown>>;
