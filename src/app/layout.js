'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { Provider, useDispatch } from 'react-redux';
import store from '@/redux/store';
import { detectCurrency } from '@/redux/currencySlice';
import { useEffect } from 'react';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// Wrapper to call useEffect inside layout
function CurrencyDetectorWrapper({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(detectCurrency());
  }, [dispatch]);

  return children;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Provider store={store}>
          <CurrencyDetectorWrapper>
            {children}
          </CurrencyDetectorWrapper>
        </Provider>
      </body>
    </html>
  );
}
