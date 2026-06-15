import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "@turbodocx/html-to-docx · Next.js example",
  description: "Generate a Word .docx in the browser with @turbodocx/html-to-docx",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
