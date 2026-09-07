import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientErrorListener } from "./client-error-listener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docksmith.vercel.app"),
  title: {
    default: "Docksmith",
    template: "%s",
  },
  description: "쓰던 PDF/Word/Excel 양식으로 반복 문서를 자동 생성하는 Docksmith입니다.",
  openGraph: {
    siteName: "Docksmith",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientErrorListener />
        {children}
      </body>
    </html>
  );
}
