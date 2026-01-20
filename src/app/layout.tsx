import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Partner Earnings Calculator | Upgraded Points",
  description: "See how much you could earn on credit card referrals. Enter your website or YouTube channel to get a free earnings estimate based on your traffic and content.",
  keywords: "affiliate earnings, credit card affiliate, partner program, content creator earnings, affiliate calculator",
  icons: {
    icon: '/favicon-32x32.webp',
    apple: '/favicon-32x32.webp',
  },
  openGraph: {
    title: "Partner Earnings Calculator | Upgraded Points",
    description: "See how much you could earn on credit card referrals with our partner program.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
