import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Porygon Industrial OS',
  description: 'Enterprise-grade industrial intelligence platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-carbon-950 text-white min-h-screen`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
