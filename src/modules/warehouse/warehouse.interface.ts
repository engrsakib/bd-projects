import { IAddress } from "@/interfaces/common.interface";

export type IWareHouse = {
  name: string;
  description?: string;
  slug: string;
  address: IAddress;
};
