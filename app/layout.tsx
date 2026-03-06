import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThidaBeauty — ថីតាប្យូទី | Luxury Beauty Cambodia",
  description:
    "ThidaBeauty - Cambodia's premier luxury beauty destination. Authentic skincare, makeup & fragrance. Free delivery over $30. Shop now.",
  keywords:
    "beauty cambodia, skincare phnom penh, makeup cambodia, luxury beauty, ថីតាប្យូទី",
  openGraph: {
    title: "ThidaBeauty — Luxury Beauty Cambodia",
    description:
      "Authentic luxury cosmetics, skincare & fragrance for the modern Cambodian woman.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
