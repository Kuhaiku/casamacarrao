// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { RealTimeSync } from '@/components/real-time-sync' // NOVO: Importando o sincronizador
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// NOVO: Configuração de cor do tema para o navegador/PWA
export const viewport: Viewport = {
  themeColor: "#ea580c",
};

export const metadata: Metadata = {
  title: 'Casa do Macarrão - Sistema de Pedidos',
  description: 'Monte seu macarrão do seu jeito na Casa do Macarrão',
  generator: 'v0.app',
  manifest: '/manifest.json', // NOVO: Link para o arquivo do PWA
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <RealTimeSync /> {/* NOVO: Inicia a busca no banco de dados no momento zero */}
        {children}
        
      </body>
    </html>
  )
}