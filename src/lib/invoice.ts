import { CounterModel } from "@/common/models/counter.model";

class Service {
  private prefix = "CDBD";
  private counterName = "invoice_number";

  async generateInvoiceNumber(order_id: number): Promise<string> {
    const year = new Date().getFullYear();

    const counterDoc = await CounterModel.findOneAndUpdate(
      { name: this.counterName },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    ).lean();

    const seq = counterDoc.sequence || 1;
    const paddedSeq = String(seq).padStart(6, "0");

    return `${this.prefix}-${year}-${paddedSeq}-${order_id}`;
  }
}

export const InvoiceService = new Service();
