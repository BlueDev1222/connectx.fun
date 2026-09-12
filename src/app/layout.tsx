import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "ConnectX — Connect. Create. Play.",
    template: "%s · ConnectX",
  },
  description:
    "The social network built for Minecraft. Find your people, share your builds, and discover your next server.",
  openGraph: {
    title: "ConnectX",
    description: "The social network built for Minecraft",
    type: "website",
  },
  twitter: { card: "summary", title: "ConnectX" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
