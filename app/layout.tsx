import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal Clarity AI — understand your documents",
  description:
    "A GenAI assistant that simplifies legal documents, flags risky clauses, compares contracts, and answers questions grounded in your own paperwork.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
