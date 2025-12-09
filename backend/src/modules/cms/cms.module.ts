// cms.model.ts
import { Schema, model } from "mongoose";
import {
  ContentManagementModel,
  IContentManagement,
  IFeaturedProducts,
} from "./cms.interface";

const contentManagerSchema = new Schema<IContentManagement>(
  {
    banners: [
      {
        products_id: [
          {
            type: String,
            required: false,
          },
        ],
        banner_url: {
          type: String,
          required: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

const featuredProductsSchema = new Schema<IFeaturedProducts>(
  {
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        variant: {
          type: Schema.Types.ObjectId,

          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

const FeaturedProducts = model<IFeaturedProducts>(
  "FeaturedProducts",
  featuredProductsSchema
);

const ContentManagement = model<IContentManagement, ContentManagementModel>(
  "CMS",
  contentManagerSchema
);

export { ContentManagement, FeaturedProducts };

export default ContentManagement;
