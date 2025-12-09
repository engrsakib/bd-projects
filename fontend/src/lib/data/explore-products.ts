const productData = [
  {
    id: 1,
    name: "Black Stiletto Rhinestone Heels – S0054",
    slug: "black-stiletto-rhinestone-heels--s0054",
    img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop&crop=center",
    price: 2850,
    category: "Women",
    discountPrice: 2250,
    rating: 4.8,
    reviews: 124,
    isPreOrderable: true,
    variants: [
      { size: "35", sku: "S0054-35" },
      { size: "36", sku: "S0054-36" },
      { size: "37", sku: "S0054-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=600&fit=crop"
    ],
    material: "Satin, Rhinestone",
    heelHeight: "10cm",
    color: "Black",
    availableStock: 20,
    tags: ["black", "stiletto", "rhinestone", "heels", "s0054"],
    description: "Glamorous rhinestone-adorned stilettos perfect for evening events."
  },
  {
    id: 2,
    name: "Elegant 6cm Stiletto Sandals Heels for Women – N0137",
    slug: "elegant-6cm-stiletto-sandals-heels-for-women--n0137",
    img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center",
    price: 2850,
    category: "Women",
    discountPrice: 2250,
    rating: 4.6,
    reviews: 89,
    isPreOrderable: false,
    variants: [
      { size: "35", sku: "N0137-35" },
      { size: "36", sku: "N0137-36" },
      { size: "37", sku: "N0137-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop"
    ],
    material: "Synthetic Leather",
    heelHeight: "6cm",
    color: "Nude",
    availableStock: 27,
    tags: ["elegant", "6cm", "stiletto", "sandals", "heels", "for", "women", "n0137"],
    description: "Stylish and comfy sandals for everyday elegance."
  },
  {
    id: 3,
    name: "Classic Pointed Toe Pumps – P0089",
    slug: "classic-pointed-toe-pumps--p0089",
    img: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400&h=400&fit=crop&crop=center",
    price: 3200,
    category: "Women",
    discountPrice: 2650,
    rating: 4.9,
    reviews: 156,
    isPreOrderable: true,
    variants: [
      { size: "35", sku: "P0089-35" },
      { size: "36", sku: "P0089-36" },
      { size: "37", sku: "P0089-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=600&h=600&fit=crop"
    ],
    material: "Leather",
    heelHeight: "9cm",
    color: "Red",
    availableStock: 34,
    tags: ["classic", "pointed", "toe", "pumps", "p0089"],
    description: "Classic pumps for a powerful and timeless look."
  },
  {
    id: 4,
    name: "Strappy Block Heel Sandals – B0156",
    slug: "strappy-block-heel-sandals--b0156",
    img: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop&crop=center",
    price: 2650,
    category: "Women",
    discountPrice: 2100,
    rating: 4.7,
    reviews: 203,
    isPreOrderable: false,
    variants: [
      { size: "35", sku: "B0156-35" },
      { size: "36", sku: "B0156-36" },
      { size: "37", sku: "B0156-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop"
    ],
    material: "PU Leather",
    heelHeight: "7cm",
    color: "White",
    availableStock: 41,
    tags: ["strappy", "block", "heel", "sandals", "b0156"],
    description: "Strappy sandals built for long-lasting comfort."
  },
  {
    id: 5,
    name: "Metallic Platform Heels – M0234",
    slug: "metallic-platform-heels--m0234",
    img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop&crop=center",
    price: 3450,
    category: "Women",
    discountPrice: 2890,
    rating: 4.5,
    reviews: 67,
    isPreOrderable: true,
    variants: [
      { size: "35", sku: "M0234-35" },
      { size: "36", sku: "M0234-36" },
      { size: "37", sku: "M0234-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=600&fit=crop"
    ],
    material: "Metallic Finish",
    heelHeight: "12cm",
    color: "Silver",
    availableStock: 48,
    tags: ["metallic", "platform", "heels", "m0234"],
    description: "High-rise platforms with a shining metallic vibe."
  },
  {
    id: 6,
    name: "Ankle Strap Stilettos – A0178",
    slug: "ankle-strap-stilettos--a0178",
    img: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&h=400&fit=crop&crop=center",
    price: 2950,
    category: "Women",
    discountPrice: 2350,
    rating: 4.8,
    reviews: 142,
    isPreOrderable: false,
    variants: [
      { size: "35", sku: "A0178-35" },
      { size: "36", sku: "A0178-36" },
      { size: "37", sku: "A0178-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&h=600&fit=crop"
    ],
    material: "Faux Suede",
    heelHeight: "8cm",
    color: "Beige",
    availableStock: 55,
    tags: ["ankle", "strap", "stilettos", "a0178"],
    description: "Secure and chic ankle straps for formal occasions."
  },
  {
    id: 7,
    name: "Peep Toe Wedge Sandals – W0123",
    slug: "peep-toe-wedge-sandals--w0123",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
    price: 2450,
    category: "Women",
    discountPrice: 1950,
    rating: 4.4,
    reviews: 98,
    isPreOrderable: true,
    variants: [
      { size: "35", sku: "W0123-35" },
      { size: "36", sku: "W0123-36" },
      { size: "37", sku: "W0123-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop"
    ],
    material: "Canvas",
    heelHeight: "5cm",
    color: "Champagne",
    availableStock: 62,
    tags: ["peep", "toe", "wedge", "sandals", "w0123"],
    description: "Breathable wedge sandals for relaxed summer wear."
  },
  {
    id: 8,
    name: "Crystal Embellished Pumps – C0267",
    slug: "crystal-embellished-pumps--c0267",
    img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center",
    price: 3850,
    category: "Women",
    discountPrice: 3200,
    rating: 4.9,
    reviews: 78,
    isPreOrderable: false,
    variants: [
      { size: "35", sku: "C0267-35" },
      { size: "36", sku: "C0267-36" },
      { size: "37", sku: "C0267-37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop"
    ],
    material: "Mesh with Crystals",
    heelHeight: "11cm",
    color: "Blue",
    availableStock: 69,
    tags: ["crystal", "embellished", "pumps", "c0267"],
    description: "Crystal-embellished pumps for show-stopping entrances."
  }
];

export default productData;