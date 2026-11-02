import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://observatorio-vial-grupo1.vercel.app'),
  title: {
    default: "Observatorio Vial | Costa Serena",
    template: "%s | Observatorio Vial"
  },
  description: "Tablero interactivo y análisis integral de siniestralidad vial para el Concejo Deliberante de Costa Serena.",
  keywords: ["Seguridad Vial", "Observatorio", "Costa Serena", "Siniestros", "Accidentes de tránsito", "Estadísticas", "Dashboard"],
  authors: [{ name: "Grupo 1" }],
  openGraph: {
    title: "Observatorio Vial | Costa Serena",
    description: "Análisis integral de siniestralidad vial basado en datos. Recomendaciones estratégicas de infraestructura y fiscalización.",
    url: "https://observatorio-vial-grupo1.vercel.app",
    siteName: "Observatorio Vial Costa Serena",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Observatorio Vial | Costa Serena",
    description: "Análisis estratégico de siniestralidad vial para Costa Serena.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
