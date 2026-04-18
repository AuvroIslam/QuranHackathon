import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
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

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DeenQuest - Your Journey Back to the Quran",
  description: "A gamified, AI-powered Quran companion that helps you build a daily connection with the Quran.",
  icons: { icon: "/deenQuestLogo.png", apple: "/deenQuestLogo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" href="/deenQuestLogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/deenQuestLogo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 flex-1 min-h-0 relative overflow-y-auto">
            <div
              className="fixed inset-0 md:left-64 z-0 pointer-events-none"
              style={{
                backgroundColor: "#10153A",
                backgroundImage: "url('/kaaba-bg-longer.png')",
                backgroundSize: "100% auto",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div className="bg-overlay" />
            <div className="relative z-10">
              {children}
            </div>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontSize: "14px",
                background: "#1e1f3a",
                color: "#f0e6ff",
                border: "1px solid rgba(180,120,255,0.2)",
              },
              success: { iconTheme: { primary: "#b47aff", secondary: "#1e1f3a" } },
              error: { iconTheme: { primary: "#e491c9", secondary: "#1e1f3a" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
