import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Poppins, DM_Sans, DM_Serif_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { VoucherProvider } from "@/components/voucher-context"
import { CreditProvider } from "@/components/credit-context"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body className="font-poppins antialiased">
        <CreditProvider>
          <VoucherProvider>
            <Toaster />
            {children}
          </VoucherProvider>
        </CreditProvider>
        <Analytics />
      </body>
    </html>
  )
}
