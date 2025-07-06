'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { Provider } from 'react-redux';
import store from '@/redux/store'; // make sure you have this path correct

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Provider store={store}>
          {children}
        </Provider>
      </body>
    </html>
  );
}
