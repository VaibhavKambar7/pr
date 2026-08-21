import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Pr",
  description: "Prompt infrastructure for developer teams.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("pr.theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
