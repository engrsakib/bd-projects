import { IAddress } from "@/interfaces/common.interface";

export type IOutlet = {
  name: string;
  slug: string;
  type: "OUTLET" | "WAREHOUSE";
  address: IAddress;
};
