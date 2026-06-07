import { Cinzel, Crimson_Pro, IM_Fell_English } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel({ 
  subsets: ['latin'], 
  variable: '--font-cinzel' 
})

const crimson = Crimson_Pro({ 
  subsets: ['latin'], 
  weight: ['300','400','600'], 
  style: ['normal','italic'], 
  variable: '--font-crimson' 
})

const imFell = IM_Fell_English({ 
  subsets: ['latin'], 
  weight: '400', 
  style: ['normal','italic'], 
  variable: '--font-im-fell' 
})

export const metadata = { 
  title: 'Witch Hat Atelier — Sigil Forge' 
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${crimson.variable} ${imFell.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}