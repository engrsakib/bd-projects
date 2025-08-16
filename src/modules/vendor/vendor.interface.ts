import { Types } from "mongoose";

export type IShop = {
  name: string;
  slug: string; // auto-generated from name
  logo: string;
  phone_number?: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    division?: string;
    postal_code?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
};

export type IPayment = {
  account_type: "bank" | "bkash" | "nagad" | "rocket" | "upay";
  account_name?: string;
  account_number?: string; // For mobile: bKash/Nagad number
  bank_name?: string; // For bank
  branch_name?: string; // For bank
  routing_number?: string; // For bank
};

export type IDocument = {
  NID?: {
    front: string;
    back: string;
  };
  trade_license?: string;
  tin_certificate?: string;
  passport?: {
    front: string;
    back: string;
  };
};

export type ISocialLink = {
  name: string;
  url: string;
};

export type IVendor = {
  owner: Types.ObjectId; // ref to "User"
  shop: IShop;
  payment: IPayment;
  documents: IDocument;
  social_links?: ISocialLink[];
  status?: "pending" | "approved" | "rejected" | "suspended";
};
