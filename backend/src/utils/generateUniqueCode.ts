import { randomBytes } from "crypto";

export const generateUniqueCode = (range: number = 3): string => {
  return randomBytes(range).toString("hex");
};
