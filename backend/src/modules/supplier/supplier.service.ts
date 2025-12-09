import ApiError from "@/middlewares/error";
import { ISupplier } from "./supplier.interface";
import { SupplierModel } from "./supplier.model";
import { HttpStatusCode } from "@/lib/httpStatus";

class Service {
  async createSupplier(data: ISupplier) {
    // Auto-generate 4 digit contact_id if not provided
    if (!data.contact_id) {
      data.contact_id = Math.floor(1000 + Math.random() * 9000);
    }

    // prevent duplicate
    const existingSupplier = await SupplierModel.findOne({
      $or: [{ name: data.name }, { contact_id: data.contact_id }],
    });
    if (existingSupplier) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "Supplier with this name or contact ID already exists. Please use a different name or contact ID."
      );
    }

    const result = await SupplierModel.create(data);
    return result;
  }

  async getAllSuppliers() {
    const result = await SupplierModel.find({});
    return result;
  }
}

export const SupplierService = new Service();
