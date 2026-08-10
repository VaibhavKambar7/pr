import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Promptu",
  description: "Prompt infrastructure for developer teams.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
