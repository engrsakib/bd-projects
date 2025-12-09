import { model, Schema } from "mongoose";
import { IBanner } from "./banner.interface";

const bannerSchema = new Schema<IBanner>({
  thumbnail: { type: String, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
  type: { type: String, enum: ["normal", "featured"], required: true },
});

export const BannerModel = model<IBanner>("banner", bannerSchema);
