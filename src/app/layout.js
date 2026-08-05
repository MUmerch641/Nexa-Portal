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

export const metadata = {
  title: "NEXA | Software House Management System",
  description: "NEXA Enterprise Software House Management System - Employees, Payroll, Attendance, Projects & Client Portal",
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%230f172a"/><path d="M25 25 V75 L55 25 V75 H75 V25 Z" fill="none" stroke="%233b82f6" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/><path d="M30 25 L70 75" stroke="%2310b981" stroke-width="12" stroke-linecap="round"/></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
