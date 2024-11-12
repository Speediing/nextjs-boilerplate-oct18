import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pottery Barn Content',
  description: 'SSR website displaying Pottery Barn content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://www.potterybarn.com/.static/202444/81643618/dist/external/common.80720cf1.js"></script>
        <link rel="stylesheet" href="https://www.potterybarn.com/.static/dist/css/global/pb/global-pb-e082450ec397e68772eceadd730273d4c0867523.css"></link>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}