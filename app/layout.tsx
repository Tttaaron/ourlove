import type { Metadata } from "next";
import { Playfair_Display, ZCOOL_QingKe_HuangYou, Outfit } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { UserProvider } from "@/components/providers/user-provider";
import { Toaster } from "sonner";

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-english",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-sans",
});

const zcoolQingKeHuangYou = ZCOOL_QingKe_HuangYou({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-chinese",
});

export const metadata: Metadata = {
    title: "OurLove",
    description: "A love story timeline and memory board",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="pink-cherry">
            <body className={`${playfairDisplay.variable} ${zcoolQingKeHuangYou.variable} ${outfit.variable} antialiased font-sans`}>
                <ThemeProvider>
                    <UserProvider>
                        {children}
                    </UserProvider>
                </ThemeProvider>
                <Toaster position="top-center" theme="system" richColors />
            </body>
        </html>
    );
}
