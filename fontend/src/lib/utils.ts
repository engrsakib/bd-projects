import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function chunkInto<T>(arr: T[], columns: number): T[][] {
  const result: T[][] = Array.from({ length: columns }, () => [])
  arr.forEach((item, i) => result[i % columns].push(item))
  return result
}