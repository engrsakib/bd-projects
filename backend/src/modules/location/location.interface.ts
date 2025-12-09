import { IAddress } from "@/interfaces/common.interface";

export type ILocation = {
  name: string;
  description?: string;
  slug: string;
  type: "outlet" | "warehouse" | "distribution_center";
  address: IAddress;
};
