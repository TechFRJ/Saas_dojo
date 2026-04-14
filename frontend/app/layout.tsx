import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FightClub SaaS",
  description: "Sistema para academias de luta",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
