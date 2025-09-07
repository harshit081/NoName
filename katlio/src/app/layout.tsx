import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Katlio - Real-time Chat",
  description: "A modern real-time chat application with dark mode UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-900 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
