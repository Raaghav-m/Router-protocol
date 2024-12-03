import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProvider from "./components/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Navbar from "./components/ui/Navbar";
import {MoralisProvider} from "react-moralis"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Okto React SDK",
  description: "Okto React SDK",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={inter.className}>
        <MoralisProvider initializeOnMount={false}>
        <AppProvider session={session}>
          {/* <Navbar /> */}
          {children}
        </AppProvider>
        </MoralisProvider>
      </body>
    </html>
  );
}
