import Ean from "ean-generator";

class Barcode {
  private ean: Ean;

  constructor() {
    this.ean = new Ean(["900"]);
  }

  public generateEAN13(): string {
    return this.ean.create();
  }

  public generateBatch(count: number): string[] {
    if (count <= 0) {
      throw new Error("Batch size must be greater than zero");
    }

    return this.ean.createMultiple({ size: count });
  }
}

export const BarcodeService = new Barcode();
