import { Types } from "mongoose";
import { DefaultsPurchaseModel } from "./defult-purchase.model";
import { IDefaultsPurchase } from "./default-purchase.interface";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { VariantModel } from "../variant/variant.model";

class Service {
  async createPurchase(data: IDefaultsPurchase): Promise<IDefaultsPurchase> {
    const session = await DefaultsPurchaseModel.startSession();
    session.startTransaction();
    try {
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
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "variant and product are required"
        );
      }

      // Normalise numeric fields with defaults
      const unit_cost = typeof data.unit_cost === "number" ? data.unit_cost : 0;
      const discount = typeof data.discount === "number" ? data.discount : 0;
      const tax = typeof data.tax === "number" ? data.tax : 0;

      // Try to find existing DefaultsPurchase by variant (unique constraint)
      let defaults = await DefaultsPurchaseModel.findOne({
        variant: variantId,
      }).session(session);

      if (defaults) {
        // Update existing
        defaults.product = productId;
        defaults.supplier = supplierId;
        defaults.unit_cost = unit_cost;
        defaults.discount = discount;
        defaults.tax = tax;
        await defaults.save({ session });
      } else {
        // Create new document (inside transaction)
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

        // Ensure Variant exists and set its default_purchase to the new DefaultsPurchase _id
        const variantDoc =
          await VariantModel.findById(variantId).session(session);
        if (!variantDoc) {
          // If variant missing, abort -> throw so transaction rolls back
          throw new ApiError(HttpStatusCode.NOT_FOUND, "Variant not found");
        }
        variantDoc.default_purchase = defaults._id as Types.ObjectId;
        await variantDoc.save({ session });
      }

      await session.commitTransaction();
      return defaults as IDefaultsPurchase;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const DefaultsPurchaseService = new Service();
