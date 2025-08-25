import mongoose from "mongoose";
import { ILot } from "./lot.interface";
import { LotModel } from "./lot.model";

class Service {
  async createLot(data: ILot, session: mongoose.mongo.ClientSession) {
    const [newLot] = await LotModel.create([data], { session });

    return newLot;
  }

  // const lot = new LotsModel({
  //   qty_available: item.qty,
  //   cost_per_unit: effectiveUnitCost,
  //   received_at: data.received_at || Date.now(),
  //   createdBy: data.created_by,
  //   variant: item.variant,
  //   product: item.product,
  //   location: data.location,
  //   source: {
  //     type: "purchase",
  //     ref_id: purchase._id,
  //   },
  //   lot_number:
  //     item.lot_number ||
  //     `PUR-${purchase.purchase_number}-${String(item.variant).slice(-4)}`,
  //   expiry_date: item.expiry_date || null,
  //   qty_total: item.qty,
  //   qty_reserved: 0,
  //   status: "active",
  //   notes: "",
  //   stock: stock._id,
  // });
  // await lot.save({ session });
}

export const LotService = new Service();
