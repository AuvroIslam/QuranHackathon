import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeenQuest AI - Your Journey Back to the Quran",
  description: "A gamified, AI-powered Quran companion that helps you build a daily connection with the Quran.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="google" content="notranslate" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          <main
            className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 flex-1 relative"
            style={{
              backgroundColor: '#ffffff',
              backgroundImage: "url('/hero-bg.png')",
              backgroundSize: '100% auto',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" style={{ top: '30%' }} />
            <div className="relative z-10">
              {children}
            </div>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontSize: "14px" },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
