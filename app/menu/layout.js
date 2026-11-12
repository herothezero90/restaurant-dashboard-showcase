"use client";
import { Lexend } from "next/font/google";
import "./styles/globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export default function MenuLayout({ children }) {
  return (
    <div className={lexend.className}>
      {children}
    </div>
  );
}