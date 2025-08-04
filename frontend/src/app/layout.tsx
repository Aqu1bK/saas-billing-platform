// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// --- Import the SessionProvider Wrapper (Client Component) ---
import SessionProviderWrapper from '@/components/Providers/SessionProviderWrapper'; // <-- CORRECTED IMPORT
// --- Import the Header and Footer components ---
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS Billing Platform",
  description: "A professional SaaS billing solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // --- CRITICAL: Wrap everything in SessionProviderWrapper (Client Component) ---
    // The SessionProviderWrapper is a Client Component that correctly uses next-auth's SessionProvider.
    // This makes session data available to useSession hook throughout the app.
    <SessionProviderWrapper>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </body>
      </html>
    </SessionProviderWrapper>
    // --- END SessionProviderWrapper ---
  );
}