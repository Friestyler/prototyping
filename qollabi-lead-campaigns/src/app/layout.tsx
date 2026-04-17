import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export const metadata: Metadata = {
  title: "Qollabi — Lead Campaigns",
  description: "Insurance broker lead campaign management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-white text-gray-900 text-sm">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-white">{children}</main>
        </div>
      </body>
    </html>
  );
}
