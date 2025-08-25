import mongoose from "mongoose";
import { ITransfer } from "./transfer.interface";
import { TransferModel } from "./transfer.model";

class Service {
  async create(data: ITransfer, session: mongoose.mongo.ClientSession) {
    const [newTransfer] = await TransferModel.create([data], { session });

    return newTransfer;
  }
}

export const TransferService = new Service();
