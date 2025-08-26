import mongoose, { Types } from "mongoose";
import { ITransfer } from "./transfer.interface";
import { TransferModel } from "./transfer.model";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";

class Service {
  async create(data: ITransfer, session: mongoose.mongo.ClientSession) {
    const [newTransfer] = await TransferModel.create([data], { session });

    return newTransfer;
  }

  async getAllTransfers(
    options: IPaginationOptions,
    filters: { from: string; to: string }
  ) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);
    const { from, to } = filters;
    const query: any = {};
    if (from) {
      query.from = from;
    }
    if (to) {
      query.to = to;
    }

    const result = await TransferModel.find(query)
      .populate([
        {
          path: "from",
          model: "Location",
        },
        {
          path: "to",
          model: "Location",
        },
        {
          path: "transferBy",
          model: "Admin",
        },
        {
          path: "items.variant",
          model: "Variant",
        },
      ])
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await TransferModel.countDocuments(query);

    return {
      meta: {
        total: total,
        page: page || 1,
        limit: limit || 10,
      },
      data: result,
    };
  }

  async getByLocation(options: IPaginationOptions, location: Types.ObjectId) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const result = await TransferModel.find({
      $or: [
        {
          from: location,
        },
        {
          to: location,
        },
      ],
    })
      .populate([
        {
          path: "from",
          model: "Location",
        },
        {
          path: "to",
          model: "Location",
        },
        {
          path: "transferBy",
          model: "Admin",
        },
        {
          path: "items.variant",
          model: "Variant",
        },
      ])
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await TransferModel.countDocuments({
      $or: [
        {
          from: location,
        },
        {
          to: location,
        },
      ],
    });

    return {
      meta: {
        total: total,
        page: page,
        limit: limit,
      },
      data: result,
    };
  }
}

export const TransferService = new Service();
