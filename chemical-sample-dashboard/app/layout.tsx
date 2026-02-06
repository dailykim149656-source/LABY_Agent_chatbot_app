import React from "react"
import type { Metadata } from 'next'
import { Geist_Mono, Roboto, Michroma } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/auth-context'
import { UiLanguageProvider } from '@/lib/use-ui-language'
import './globals.css'

const michroma = Michroma({ subsets: ["latin"], weight: ["400"], variable: "--font-title" });
const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-body" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-code" });

export const metadata: Metadata = {
  title: 'LabIT, Lab by InTelligence',
  description: 'Chemical Sample Management Chatbot Dashboard',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/laby-logo.PNG',
      },
    ],
    apple: '/laby-logo.PNG',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${michroma.variable} ${roboto.variable} ${_geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UiLanguageProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </UiLanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
