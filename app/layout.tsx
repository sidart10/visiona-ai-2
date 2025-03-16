import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import TanstackClientProvider from '@/components/providers/tanstack-client-provider'
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { ClerkProvider } from "@clerk/nextjs"

// Initialize the Inter font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata = {
  title: 'Visiona',
  description: 'AI-powered platform for creating personalized AI clones',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <TanstackClientProvider>
              {children}
              <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </TanstackClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
