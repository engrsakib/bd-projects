import { ISupplier } from "./supplier.interface";
import { SupplierModel } from "./supplier.model";

class Service {
  async createSupplier(data: ISupplier) {
    // Auto-generate 4 digit contact_id if not provided
    if (!data.contact_id) {
      data.contact_id = Math.floor(1000 + Math.random() * 9000);
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
