import type { Metadata, Viewport } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const googleSans = Google_Sans({
  subsets: ["latin"],
  variable: "--font-google-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: "Smart Task Planner - Organize & Track Your Tasks",
  description: "A modern task planning application with dashboard analytics, deadline tracking, and intuitive task management.",
  keywords: ["Task Planner", "Productivity", "Project Management", "Next.js", "React"],
  authors: [{ name: "Smart Task Planner" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Smart Task Planner",
    description: "Organize, track, and manage your tasks with powerful analytics and deadline tracking.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Task Planner",
    description: "Organize, track, and manage your tasks with powerful analytics and deadline tracking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${googleSans.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
