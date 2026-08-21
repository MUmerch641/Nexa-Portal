import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalProgressBar from "@/components/GlobalProgressBar";

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
        url: '/logo.jpeg',
        type: 'image/jpeg',
      },
    ],
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalProgressBar />
        {children}
      </body>
    </html>
  );
}
