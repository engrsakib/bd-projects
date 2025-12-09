import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: { 
    remotePatterns: [
      {
        hostname: 'images.unsplash.com'
      },
      {
        hostname: 'res.cloudinary.com'
      },
      {

        hostname: 'images.pexels.com'
      },
      {
        hostname: 'example.com'
      },
      {
        hostname: 'i.ibb.co'
      },
      {
        hostname:'thecloudybd.com'
      },
      {
        hostname:'cdn-icons-png.flaticon.com'
      },
      {
        hostname: 'via.placeholder.com'
      },
      {
        hostname: 'ggbook.s3.us-east-1.amazonaws.com'
      }
    ]
  },
  
};

export default nextConfig;
