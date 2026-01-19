import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/hooks/use-auth";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Panel - Auto Pecas AI",
  description: "Plataforma Multi-Tenant de Atendimento WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
