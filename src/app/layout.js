import "./globals.css";
import { Tajawal } from "next/font/google";
import Script from "next/script";
import { LanguageProvider } from "./context/LanguageContext";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${tajawal.className} bg-[#0B0D0F]`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
