import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TKPEX | Enterprise Attendance & Workforce Management',
  description: 'Enterprise Attendance, Shift Rostering & Workforce Analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ minHeight: '100vh', margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
