import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GENI IA",
  description: "Votre intelligence artificielle personnelle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
