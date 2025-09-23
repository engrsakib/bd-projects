import { ORDER_STATUS } from "../order/order.enums";

enum MARCHANT {
  PATHAO = "pathao",
  REDEX = "redex",
  FEDEX = "fedex",
  STEAD_FAST = "steadfast",
  CARRY_BEE = "carrybee",
}

export interface ICourier {
  marchant: MARCHANT;
  tracking_url?: string;
  tracking_id?: string;
  status: ORDER_STATUS;
  contact_number?: string;
  email?: string;
  address?: string;
}
