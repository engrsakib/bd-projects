// import InventoryModel from "../inventory/inventory.module";
// import { IInventory } from "../inventory/inventory.type";
// import { IProducts } from "../products/products.type";
// import Outlet from "./outlets.module";
// import { IOutlet } from "./outlets.type";
// import slugify from "slugify";
// import mongoose from "mongoose";
// import Products from "../products/products.model";
// import ApiError from "../../middlewares/error";
// import { ProductsService } from "../products/products.service";

// interface QueryParams {
//   page: number;
//   limit: number;
//   search: string;
// }

// interface IOutletInventoryResponse {
//   product: IProducts;
//   attributes: string[] | null;
//   variants: IInventory["variants"];
// }

// export class Service {
//   async createOutlet(outletData: IOutlet) {
//     // Generate slug from name if not provided
//     if (!outletData.slug && outletData.name) {
//       outletData.slug = slugify(outletData.name, { lower: true });
//     }
//     const outlet = await Outlet.create(outletData);
//     console.log(outlet);
//     // console.log({ outlet, outletData });
//     await outlet.save();
//     return outlet;
//   }

//   async getAllWarehousesOutlets({ page, limit, search }: QueryParams) {
//     const query = search
//       ? {
//           $or: [
//             { name: { $regex: search, $options: "i" } },
//             { slug: { $regex: search, $options: "i" } },
//             { "address.local_address": { $regex: search, $options: "i" } },
//           ],
//         }
//       : {};

//     const outlets = await Outlet.find(query)
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     const total = await Outlet.countDocuments(query);

//     return {
//       meta: {
//         total: total,
//         page: page || 1,
//         limit: limit || 10,
//       },
//       outlets,
//     };
//   }
//   async getAllWarehouses({ page, limit, search }: QueryParams) {
//     const query = search
//       ? {
//           $or: [
//             { name: { $regex: search, $options: "i" } },
//             { slug: { $regex: search, $options: "i" } },
//             { "address.local_address": { $regex: search, $options: "i" } },
//           ],
//           type: "WAREHOUSE",
//         }
//       : {};

//     const warehouse = await Outlet.find({ type: "WAREHOUSE" })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     const total = await Outlet.countDocuments({ type: "WAREHOUSE" });

//     return {
//       meta: {
//         total: total,
//         page: page || 1,
//         limit: limit || 10,
//       },
//       warehouse,

//     };
//   }
//   async getAllOutlets({ page, limit, search }: QueryParams) {
//     const query = search
//       ? {
//           $or: [
//             { name: { $regex: search, $options: "i" } },
//             { slug: { $regex: search, $options: "i" } },
//             { "address.local_address": { $regex: search, $options: "i" } },
//           ],
//         }
//       : {};

//     const outlets = await Outlet.find({ ...query, type: "OUTLET" })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     const total = await Outlet.countDocuments({ type: "OUTLET", ...query });

//     return {
//       outlets,
//        meta: {
//           total: total,
//           page: page || 1,
//           limit: limit || 10,
//         },

//     };
//   }

//   async getOutletProductInventory(
//     outlet_id: string,
//     product_id: string
//   ): Promise<any> {
//     // Validate ObjectIds
//     if (
//       !mongoose.isValidObjectId(outlet_id) ||
//       !mongoose.isValidObjectId(product_id)
//     ) {
//       throw new ApiError(500, "Invalid outlet ID or product ID");
//     }

//     const product = await Products.findById(product_id);
//     if (!product) {
//       throw new ApiError(404, "Product not found");
//     }

//     // Ensure outlet exists
//     // Query inventory for the specific outlet and product
//     const inventory = await InventoryModel.find({
//       outlet: new mongoose.Types.ObjectId(outlet_id),
//       product: new mongoose.Types.ObjectId(product_id),
//     })
//       // .populate("product") // Populate product details
//       .populate("outlet") // Populate outlet details
//       // .populate("warehouse") // Populate warehouse details
//       .lean();

//     if (!inventory) {
//       throw new ApiError(
//         404,
//         "No inventory found for the specified outlet and product"
//       );
//     }

//     // Ensure product is populated and valid
//     // if (!inventory.product) {
//     //   throw new ApiError(404,"Product not found");
//     // }

//     // Return the product with inventory attributes and variants
//     return {
//       product,
//       inventory,
//     };
//   }
//   async getWarehouseProductInventory(
//     warehouse_id: string,
//     product_id: string
//   ): Promise<any> {
//     // Validate ObjectIds
//     if (
//       !mongoose.isValidObjectId(warehouse_id) ||
//       !mongoose.isValidObjectId(product_id)
//     ) {
//       throw new ApiError(404, "Invalid outlet ID or product ID");
//     }

//     const product = await Products.findById(product_id);
//     if (!product) {
//       throw new ApiError(404, "Product not found");
//     }
//     // Ensure outlet exists
//     // Query inventory for the specific outlet and product
//     const inventory = await InventoryModel.find({
//       warehouse: new mongoose.Types.ObjectId(warehouse_id),
//       outlet: null, // Ensure we are only looking at warehouse inventory
//       product: new mongoose.Types.ObjectId(product_id),
//     })
//       .populate("warehouse") // Populate warehouse details
//       .lean();

//     if (!inventory) {
//       throw new ApiError(
//         404,
//         "No inventory found for the specified outlet and product"
//       );
//     }

//     return {
//       inventory,
//       product,
//     };
//   }
//   async getOutletInventory(
//     { outlet_id }: { outlet_id: string },
//     { page, limit }: QueryParams
//   ): Promise<any> {
//     // Validate ObjectIds
//     if (!outlet_id || !mongoose.isValidObjectId(outlet_id)) {
//       throw new ApiError(500, "Invalid outlet ID or product ID");
//     }

//     const outlet = await Outlet.findById(outlet_id);
//     if (!outlet) {
//       throw new ApiError(404, "Outlet not found");
//     }

//     // Ensure outlet exists
//     // Query inventory for the specific outlet and product
//     const inventory = await InventoryModel.find({
//       outlet: new mongoose.Types.ObjectId(outlet_id),
//     })
//       .populate("product") // Populate product details
//       // .populate("outlet") // Populate outlet details
//       // .populate("warehouse") // Populate warehouse details
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     if (!inventory) {
//       throw new ApiError(
//         404,
//         "No inventory found for the specified outlet and product"
//       );
//     }

//     // Ensure product is populated and valid
//     // if (!inventory.product) {
//     //   throw new ApiError(404,"Product not found");
//     // }

//     // Return the product with inventory attributes and variants
//     const total = await InventoryModel.countDocuments({
//       outlet: new mongoose.Types.ObjectId(outlet_id),
//     });
//     return {
//       outlet,
//       inventory,
//     meta: {
//           total: total,
//           page: page || 1,
//           limit: limit || 10,
//         },
//     };
//   }

//   async getWarehouseInventory(
//     { warehouse_id }: { warehouse_id: string },
//     { page, limit }: QueryParams
//   ): Promise<any> {
//     // Validate ObjectIds
//     if (!mongoose.isValidObjectId(warehouse_id)) {
//       throw new ApiError(500, "Invalid outlet ID or product ID");
//     }

//     const warehouse = await Outlet.findById(warehouse_id);
//     if (!warehouse) {
//       throw new ApiError(404, "Warehouse not found");
//     }

//     // Ensure outlet exists
//     // Query inventory for the specific outlet and product
//     const inventory = await InventoryModel.find({
//       warehouse: new mongoose.Types.ObjectId(warehouse_id),
//       outlet: null,
//     })
//       .populate("product") // Populate product details
//       // .populate("outlet") // Populate outlet details
//       // .populate("warehouse") // Populate warehouse details
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     if (!inventory) {
//       throw new ApiError(
//         404,
//         "No inventory found for the specified outlet and product"
//       );
//     }

//     const total = await InventoryModel.countDocuments({
//       warehouse: new mongoose.Types.ObjectId(warehouse_id),
//       outlet: null,
//     });

//     // Return the product with inventory attributes and variants
//     return {
//       warehouse,
//       inventory,
//        meta: {
//           total: total,
//           page: page || 1,
//           limit: limit || 10,
//         },
//     };
//   }

//   async searchProductOnInventory(
//     { outlet_id }: { outlet_id: string },
//     { search }: { search: string }
//   ): Promise<any> {
//     if (!search || search.trim() === "") {
//       throw new ApiError(400, "Search term cannot be empty");
//     }

//     const outlet = await Outlet.findById(outlet_id);
//     if (!outlet) {
//       throw new ApiError(404, "Outlet not found");
//     }

//     const products = await Products.find({
//       $or: [
//         { name: { $regex: search, $options: "i" } },
//         { slug: { $regex: search, $options: "i" } },
//       ],
//     }).lean();
//     let inventory: any = null;
//     if (!products || products.length === 0) {
//       inventory = await ProductsService.searchBySku(search.trim(), outlet_id);
//       return {
//         outlet,
//         inventory,
//         // products,
//       };
//     }
//     // Query inventory for the specific outlet and product
//     inventory = await InventoryModel.find({
//       outlet: new mongoose.Types.ObjectId(outlet_id),
//       product: { $in: products.map((p) => p._id) },
//     })
//       .populate("product") // Populate product details
//       // .populate("outlet") // Populate outlet details
//       // .populate("warehouse") // Populate warehouse details
//       .lean();

//     if (!inventory || inventory.length === 0) {
//       return {
//         outlet,
//         inventory: [],
//         // products: [],
//       };
//     }
//     return {
//       outlet,
//       inventory,
//       // products,
//     };
//   }
//   async searchProductOnWarehouse(
//     { warehouse_id }: { warehouse_id: string },
//     { search }: { search: string }
//   ): Promise<any> {
//     if (!search || search.trim() === "") {
//       throw new ApiError(400, "Search term cannot be empty");
//     }

//     const warehouse = await Outlet.findById(warehouse_id);
//     if (!warehouse) {
//       throw new ApiError(404, "Warehouse not found");
//     }

//     const products = await Products.find({
//       $or: [
//         { name: { $regex: search, $options: "i" } },
//         { slug: { $regex: search, $options: "i" } },
//       ],
//     }).lean();
//     let inventory: any = null;
//     if (!products || products.length === 0) {
//       inventory = await ProductsService.searchBySku(search.trim(), warehouse_id);
//       return {
//         warehouse,
//         inventory,
//         products,
//       };
//     }
//     // Query inventory for the specific outlet and product
//      inventory = await InventoryModel.find({
//       warehouse: new mongoose.Types.ObjectId(warehouse_id),
//       outlet: null, // Ensure we are only looking at warehouse inventory
//       product: { $in: products.map((p) => p._id) },
//     })
//       .populate("product") // Populate product details
//       // .populate("outlet") // Populate outlet details
//       // .populate("warehouse") // Populate warehouse details
//       .lean();
//     if (!inventory || inventory.length === 0) {
//       return {
//         warehouse,
//         inventory: [],
//         products: [],
//       };
//     }
//     return {
//       warehouse,
//       inventory,
//       products,
//     };
//   }

//   async getOutletById(id: string) {
//     return await Outlet.findById(id).lean();
//   }

//   async updateOutlet(id: string, outletData: Partial<IOutlet>) {
//     // Update slug if name is being updated
//     if (outletData.name && !outletData.slug) {
//       outletData.slug = slugify(outletData.name, { lower: true });
//     }

//     return await Outlet.findByIdAndUpdate(id, outletData, {
//       new: true,
//       runValidators: true,
//     }).lean();
//   }

//   async deleteOutlet(id: string) {
//     const result = await Outlet.findByIdAndDelete(id);
//     return !!result;
//   }
// }

// export const outletService = new Service();
