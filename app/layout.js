import { Lexend } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.css";
import { Provider } from "../components/ui/provider";

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
    <html className="light" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={lexend.className}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
