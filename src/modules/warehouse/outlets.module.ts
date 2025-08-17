// import { Schema, model } from "mongoose";
// import { IOutletAddress, Location, IOutlet, OutletModel } from "./outlets.type";

// // Address Schema
// export const Address = new Schema<IOutletAddress>(
//   {
//     division: { type: String },
//     district: { type: String },
//     thana: { type: String },
//     local_address: { type: String, required: true },
//   },

// );

// // Location Schema
// const LocationSchema = new Schema<Location>(
//   {
//     latitude: {
//       type: Number,
//       required: true,
//     },
//     longitude: {
//       type: Number,
//       required: true,
//     },
//   },

// );

// // Outlet Schema
// const OutletSchema = new Schema<IOutlet>(
//   {
//     name: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     slug: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     location: LocationSchema,
//     address: {
//       required: true,
//       type: Address,
//     },
//     type: {
//       required: true,
//       type: String,//"OUTLET" | "WAREHOUSE"
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//   }
// );

// const Outlet = model<IOutlet, OutletModel>("Outlet", OutletSchema);
// export default Outlet;
