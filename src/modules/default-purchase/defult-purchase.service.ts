import { Types } from "mongoose";
import { DefaultsPurchaseModel } from "./defult-purchase.model";
import { IDefaultsPurchase } from "./default-purchase.interface";

import { VariantModel } from "../variant/variant.model";

class Service {
  async createPurchases(
    payload: any[]
  ): Promise<{ successful: IDefaultsPurchase[]; failed: any[] }> {
    const successful: IDefaultsPurchase[] = [];
    const failed: any[] = [];

    // প্রতিটি আইটেম আলাদাভাবে প্রসেস করা হবে
    for (const data of payload) {
      const session = await DefaultsPurchaseModel.startSession();
      session.startTransaction();

      try {
        // ১. আইডি ভ্যালিডেশন ও কনভার্শন
        const variantId =
          data.variant instanceof Types.ObjectId
            ? data.variant
            : new Types.ObjectId(String(data.variant));

        const productId =
          data.product instanceof Types.ObjectId
            ? data.product
            : new Types.ObjectId(String(data.product));

        const supplierId =
          data.supplier == null
            ? null
            : data.supplier instanceof Types.ObjectId
              ? data.supplier
              : new Types.ObjectId(String(data.supplier));

        if (!variantId || !productId) {
          throw new Error("Variant and Product IDs are required");
        }

        // ২. নিউমেরিক ফিল্ড হ্যান্ডলিং
        const unit_cost =
          typeof data.unit_cost === "number" ? data.unit_cost : 0;
        const discount = typeof data.discount === "number" ? data.discount : 0;
        const tax = typeof data.tax === "number" ? data.tax : 0;

        // ৩. লজিক: খোঁজা (Upsert Logic)
        let defaults = await DefaultsPurchaseModel.findOne({
          variant: variantId,
        }).session(session);

        if (defaults) {
          // ক. আপডেট করা
          defaults.product = productId;
          defaults.supplier = supplierId;
          defaults.unit_cost = unit_cost;
          defaults.discount = discount;
          defaults.tax = tax;
          await defaults.save({ session });
        } else {
          // খ. নতুন তৈরি করা
          const createdArr = await DefaultsPurchaseModel.create(
            [
              {
                variant: variantId,
                product: productId,
                supplier: supplierId,
                unit_cost,
                discount,
                tax,
              },
            ],
            { session }
          );
          defaults = createdArr[0];

          // ভ্যারিয়েন্টের সাথে লিঙ্ক করা
          const variantDoc =
            await VariantModel.findById(variantId).session(session);
          if (!variantDoc) {
            throw new Error(`Variant not found with ID: ${variantId}`);
          }
          variantDoc.default_purchase = defaults._id as Types.ObjectId;
          await variantDoc.save({ session });
        }

        // সফল হলে কমিট এবং লিস্টে অ্যাড
        await session.commitTransaction();
        successful.push(defaults as IDefaultsPurchase);
      } catch (error: any) {
        // ফেইল করলে রোলব্যাক এবং ফেইল্ড লিস্টে অ্যাড
        await session.abortTransaction();
        failed.push({
          data,
          error: error.message || "Unknown Error",
        });
      } finally {
        session.endSession();
      }
    }

    return { successful, failed };
  }
}

export const DefaultsPurchaseService = new Service();
