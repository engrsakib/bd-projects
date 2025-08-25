import mongoose from "mongoose";
import { ILot } from "./lot.interface";
import { LotModel } from "./lot.model";

class Service {
  async createLot(data: ILot, session: mongoose.mongo.ClientSession) {
    const [newLot] = await LotModel.create([data], { session });

    return newLot;
  }
}

export const LotService = new Service();
