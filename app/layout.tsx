import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shipporiMincho = localFont({
  src: [
    {
      path: "../public/fonts/ShipporiMincho-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/ShipporiMincho-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/ShipporiMincho-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/ShipporiMincho-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/ShipporiMincho-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-shippori-mincho",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dala - fund awesome ideas!",
  description: "no algorithms. no gatekeepers. just transparent funding from people who believe in your work :)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${shipporiMincho.variable} antialiased font-[family-name:var(--font-geist-sans)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
