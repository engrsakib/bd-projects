import { Model } from "mongoose";

type TBannerItem = { products_id: string[]; banner_url: string };

export type IContentManagement = {
  banners: TBannerItem[];
};

export type ContentManagementModel = Model<
  IContentManagement,
  Record<string, unknown>
>;
export interface IFeaturedProducts {
  products: {
    product: string; // Product ID
    variant: string; // Product ID
  }[];
}
