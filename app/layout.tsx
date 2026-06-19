import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/contexts/RoleContext";
import { DataProvider } from "@/contexts/DataContext";
import { AppShell } from "@/components/layout";
import { TooltipProvider } from "@/components/ui/tooltip";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CRM Agencia de Viajes",
  description: "Sistema de gestión para agencia de viajes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <RoleProvider>
          <DataProvider>
            <TooltipProvider delay={0}>
              <AppShell>{children}</AppShell>
            </TooltipProvider>
          </DataProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
