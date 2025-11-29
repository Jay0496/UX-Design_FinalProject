import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinancePro - Financial Freedom Starts Here",
  description: "FinancePro gives you a complete, real-time picture of your money, making budgeting, goal setting, and debt payoff stress-free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased bg-white text-gray-900`}>
        <AuthProvider>
          <Navbar />
          <main>
            <ProtectedRoute>{children}</ProtectedRoute>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

