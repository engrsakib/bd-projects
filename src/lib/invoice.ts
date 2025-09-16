import { CounterModel } from "@/common/models/counter.model";
import mongoose from "mongoose";

class Service {
  private prefix = "CDBD";
  private counterName = "invoice_number";

  async generateInvoiceNumber(
    order_id: number,
    session: mongoose.mongo.ClientSession
  ): Promise<string> {
    const year = new Date().getFullYear();

    const counterDoc = await CounterModel.findOneAndUpdate(
      { name: this.counterName },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true, session }
    ).lean();

    const seq = counterDoc.sequence || 1;
    const paddedSeq = String(seq).padStart(6, "0");

    return `${this.prefix}-${year}-${paddedSeq}-${order_id}`;
  }
}

export const InvoiceService = new Service();
