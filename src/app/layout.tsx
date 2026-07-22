import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recruitment Operations Dashboard",
  description: "A modern recruitment operations dashboard for real-time status tracking and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = {
    "--font-manrope": "ui-sans-serif, system-ui, sans-serif",
    "--font-space-grotesk": "ui-sans-serif, system-ui, sans-serif",
  } as React.CSSProperties;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={fontVariables}>
        {children}
      </body>
    </html>
  );
}
