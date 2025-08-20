import { BarcodeService } from "@/lib/barcode";
import { IInventory } from "./inventory.interface";
import { InventoryModel } from "./inventory.model";

class Service {
  async create(data: IInventory) {
    for (const variant of data.variants) {
      variant.barcode = BarcodeService.generateEAN13();
    }

    await InventoryModel.create(data);
  }
}

export const InventoryService = new Service();
