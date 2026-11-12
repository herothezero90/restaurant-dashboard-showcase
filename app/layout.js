import { Lexend } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Konoba Bare | Dashboard",
  description: "Upravljanje jelovnikom, dnevnim menijem i printom jelovnika.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hr" className="light" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={lexend.className}>{children}</body>
    </html>
  );
}
