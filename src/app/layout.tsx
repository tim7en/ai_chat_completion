import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "AI Chat Hub - Premium AI Conversations",
  description: "Experience the power of AI with our sleek chat platform. Get access to various AI models with flexible pricing plans.",
  keywords: ["AI Chat", "Artificial Intelligence", "ChatGPT", "Premium AI", "Conversational AI"],
  authors: [{ name: "AI Chat Hub Team" }],
  openGraph: {
    title: "AI Chat Hub",
    description: "Premium AI conversations with flexible pricing",
    url: "https://ai-chat-hub.com",
    siteName: "AI Chat Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat Hub",
    description: "Premium AI conversations with flexible pricing",
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
        className="antialiased bg-background text-foreground font-sans"
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
