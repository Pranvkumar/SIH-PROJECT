import type {Metadata} from 'next';
import { Roboto, Playfair_Display, Dancing_Script } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TranslationProvider } from '@/contexts/TranslationContext';

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const dancing = Dancing_Script({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dancing',
});

export const metadata: Metadata = {
  title: 'CORSAIR',
  description: 'A unified platform for reporting and monitoring ocean hazards in real-time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${roboto.className} ${playfair.variable} ${dancing.variable} antialiased h-full`}>
        <TranslationProvider>
          {children}
          <Toaster />
        </TranslationProvider>
      </body>
    </html>
  );
}
