import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BlackFound — The PulseNetworkHoldings Ecosystem',
  description: 'A curated collection of apps and tools built by PulseNetworkHoldings.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
