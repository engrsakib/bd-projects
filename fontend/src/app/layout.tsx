import type { Metadata } from "next";
import { Hind_Siliguri, Poppins, Roboto } from 'next/font/google'

import "./globals.css";
import ProviderWrapper from "@/hooks/ProviderWrapper";
import { Toaster } from "@/components/ui/sonner";
import Whatsapp from "@/components/ui/whatsapp";
import Head from "next/head";
import Script from "next/script";



export const metadata: Metadata = {
  title: "The cloudy BD",
  description: "Step into style with The Cloudy BD - Your ultimate destination for trendy and affordable fashion!",
};


const hind_siliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'bengali', 'latin-ext'],
  variable: '--font-bangla',
});
// it's ok on local docker for roboto fetch error 
const roboto = Roboto({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'symbols'],
  variable: '--font-english',
})
const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin', "latin-ext"],
  variable: '--font-poppins',
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body
        className={`${hind_siliguri.variable} ${poppins.variable} ${roboto.variable} ${hind_siliguri.className} antialiased`}
      >
        <Script defer data-domain="thecloudybd.com" src="https://analytics.innovgig.com/js/script.js"></Script>
        <ProviderWrapper>
          {children}
          <Toaster  richColors/>
          <Whatsapp />
        </ProviderWrapper>
      </body>
    </html>
  );
}
