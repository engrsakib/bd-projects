import { StaticImageData } from 'next/image'


export interface Product_data {
  name: string
  img: StaticImageData
  sku: string
  priceRegular: number
  priceDiscount: number
  availableSizes: number[]
  brand: string
  status: string
  rating?: number
  reviews?: number
  mdDescription?: string
}


export const productData = [
  {
    name: ' Black Stiletto Rhinestone Heels – S0054 ',
    img: 'https://thecloudybd.com/wp-content/uploads/2025/07/photo_2025-07-03_23-01-00-700x933.jpg',
    price: 2850,
    category : 'Women',
    discountPrice: 2250,
  },
  {
    name: ' Elegant 6cm Stiletto Sandals Heels for Women – N0137',
    img: 'https://thecloudybd.com/wp-content/uploads/2025/07/photo_2025-07-03_23-01-00-700x933.jpg',
    price: 2850,
    category : 'Women',
    discountPrice: 2250,
  },
]

export type SearchProduct = {
  id: string
  name: string
  image: string
  price: number
  discount: number // percentage
}

export const mockSearchData: SearchProduct[] = [
  {
    id: "prod001",
    name: "Leather Wallet",
    image: "/placeholder.svg?height=60&width=60",
    price: 49.99,
    discount: 10,
  },
  {
    id: "prod002",
    name: "Brown Leather Belt",
    image: "/placeholder.svg?height=60&width=60",
    price: 29.99,
    discount: 0,
  },
  {
    id: "prod003",
    name: "Black Leather Shoes",
    image: "/placeholder.svg?height=60&width=60",
    price: 129.99,
    discount: 15,
  },
  {
    id: "prod004",
    name: "Formal Leather Shoes",
    image: "/placeholder.svg?height=60&width=60",
    price: 149.99,
    discount: 0,
  },
  {
    id: "prod005",
    name: "Casual Leather Shoes",
    image: "/placeholder.svg?height=60&width=60",
    price: 99.99,
    discount: 5,
  },
  {
    id: "prod006",
    name: "Leather Backpack",
    image: "/placeholder.svg?height=60&width=60",
    price: 199.99,
    discount: 20,
  },
  {
    id: "prod007",
    name: "Leather Handbag",
    image: "/placeholder.svg?height=60&width=60",
    price: 179.99,
    discount: 10,
  },
  {
    id: "prod008",
    name: "Sacchi Leather Shoes",
    image: "/placeholder.svg?height=60&width=60",
    price: 119.99,
    discount: 0,
  },
  {
    id: "prod009",
    name: "Loafer Leather Shoes",
    image: "/placeholder.svg?height=60&width=60",
    price: 109.99,
    discount: 0,
  },
  {
    id: "prod010",
    name: "Cycle Leather Shoe",
    image: "/placeholder.svg?height=60&width=60",
    price: 89.99,
    discount: 0,
  },
  {
    id: "prod011",
    name: "Half Sacchi Leather Shoe",
    image: "/placeholder.svg?height=60&width=60",
    price: 95.0,
    discount: 0,
  },
  {
    id: "prod012",
    name: "Leather Card Holder",
    image: "/placeholder.svg?height=60&width=60",
    price: 19.99,
    discount: 0,
  },
  {
    id: "prod013",
    name: "Leather Key Chain",
    image: "/placeholder.svg?height=60&width=60",
    price: 9.99,
    discount: 0,
  },
  {
    id: "prod014",
    name: "Leather Jacket",
    image: "/placeholder.svg?height=60&width=60",
    price: 299.99,
    discount: 25,
  },
  {
    id: "prod015",
    name: "Leather Gloves",
    image: "/placeholder.svg?height=60&width=60",
    price: 39.99,
    discount: 0,
  },
]
