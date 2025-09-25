import ContentManagement, { FeaturedProducts } from "./cms.module";
import ApiError from "../../middlewares/error";
import { ProductModel } from "../product/product.model";
import { StockModel } from "../stock/stock.model";

class Service {
  async addBanner(data: { products_id?: string[]; banner_url: string }) {
    // Find the existing document or create a new one if none exists
    const existingDocument = await ContentManagement.findOne();
    if (!existingDocument) {
      const newDocument = await ContentManagement.create({
        banners: [
          {
            products_id: data.products_id || [], // Default to empty array if products_id is not provided
            banner_url: data.banner_url,
          },
        ],
      });
      return newDocument;
    }

    // Update the existing document by pushing a new banner object to the `banners` array
    const result = await ContentManagement.findOneAndUpdate(
      { _id: existingDocument._id },
      {
        $push: {
          banners: {
            products_id: data.products_id || [], // Default to empty array if products_id is not provided
            banner_url: data.banner_url,
          },
        },
      },
      { new: true }
    );

    if (!result) {
      throw new ApiError(400, "Banner update failed");
    }

    return result;
  }

  async addProductIdToBanner(bannerId: string, product_id: string) {
    const result = await ContentManagement.findOneAndUpdate(
      { "banners._id": bannerId },
      {
        $addToSet: { "banners.$.products_id": product_id },
      },
      { new: true }
    );

    if (!result) {
      throw new ApiError(400, "Banner not found");
    }

    return result;
  }

  async deleteProductIdToBanner(bannerId: string, product_id: string) {
    const result = await ContentManagement.findOneAndUpdate(
      { "banners._id": bannerId },
      {
        $pull: { "banners.$.products_id": product_id },
      },
      { new: true }
    );

    if (!result) {
      throw new ApiError(400, "Banner not found");
    }

    return result;
  }

  async getBanners() {
    const result = await ContentManagement.findOne().select({ banners: 1 });
    const featuredProducts = await FeaturedProducts.findOne()
      .populate("products.product")
      .populate("products.variant")
      .lean();
    return {
      banners: result?.banners || [],
      featuredProducts: featuredProducts?.products || [],
    };
  }

  async deleteBanner(bannerId: string) {
    const existingDocument = await ContentManagement.findOne();
    if (!existingDocument) {
      throw new ApiError(404, "No document found to update");
    }

    const result = await ContentManagement.findOneAndUpdate(
      { "banners._id": bannerId },
      {
        $pull: { banners: { _id: bannerId } },
      },
      { new: true }
    );

    if (!result) {
      throw new ApiError(400, "Failed to delete banner");
    }

    return result;
  }

  async getFeaturedProducts() {
    const featuredProducts = await FeaturedProducts.findOne()
      .populate([
        { path: "products.product", model: "Product", select: "-variants" },
        { path: "products.variant", model: "Variant" },
      ])
      .lean();

    return featuredProducts;
  }

  async deleteFeaturedProducts(variant_id: string) {
    const featuredProducts = await FeaturedProducts.findOne();

    if (!featuredProducts) {
      throw new ApiError(404, "No featured products found");
    }

    // Remove product from array
    featuredProducts.products = featuredProducts.products.filter(
      (item) => item.variant?.toString() !== variant_id
    );
    await featuredProducts.save();
    return featuredProducts;
  }

  addFeaturedProducts = async (product_id: string, variant_id: string) => {
    // Check if the product exists
    console.log({ product_id, variant_id });
    const product = await ProductModel.findById({
      _id: product_id,
    });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check on stock if product is not available in stock then throw error
    const stock = await StockModel.findOne({
      product: product_id,
      variant: variant_id,
    });

    console.log(stock, "stock");

    if (!stock) {
      throw new ApiError(400, "Product is not available in stock");
    }

    let featuredProducts = await FeaturedProducts.findOne();

    if (!featuredProducts) {
      // Create new if doesn't exist
      featuredProducts = await FeaturedProducts.create({
        products: [{ product: product_id, variant: variant_id }],
      });
    } else {
      // Check if product already exists in array
      const productExists = featuredProducts.products.some(
        (item) => item.variant?.toString() === variant_id
      );

      if (!productExists) {
        // Add new product to array
        featuredProducts.products.push({
          product: product_id,
          variant: variant_id,
        });
        await featuredProducts.save();
      } else {
        throw new ApiError(400, "Product already exists in featured products");
      }
    }
    return featuredProducts;
  };
}

export const ContentManagementService = new Service();
