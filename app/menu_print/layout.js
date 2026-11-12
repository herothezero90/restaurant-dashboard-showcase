"use client";
import { Open_Sans } from "next/font/google";
import "./styles/globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export default function PrintLayout({ children }) {
  return (
    <div className={openSans.className}>
      {children}
    </div>
  );
}