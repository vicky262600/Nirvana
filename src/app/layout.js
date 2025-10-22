// 'use client';

// import { Geist, Geist_Mono } from 'next/font/google';
// import './globals.css';

// import { Provider, useDispatch } from 'react-redux';
// import store from '@/redux/store';
// import { detectCurrency } from '@/redux/currencySlice';
// import { useEffect } from 'react';

// const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
// const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// // Wrapper to call useEffect inside layout
// function CurrencyDetectorWrapper({ children }) {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     dispatch(detectCurrency());
//   }, [dispatch]);

//   return children;
// }

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
//         <Provider store={store}>
//           <CurrencyDetectorWrapper>
//             {children}
//           </CurrencyDetectorWrapper>
//         </Provider>
//       </body>
//     </html>
//   );
// }
// 'use client';

// import { Geist, Geist_Mono } from 'next/font/google';
// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import './globals.css';

// import { Provider, useDispatch } from 'react-redux';
// import { store, persistor } from '@/redux/store';
// import { detectCurrency } from '@/redux/currencySlice';
// import { useEffect } from 'react';
// // import { PersistGate } from 'redux-persist/integration/react'; // ✅ import this

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
// const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
// const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// // Wrapper to call useEffect inside layout
// function CurrencyDetectorWrapper({ children }) {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     dispatch(detectCurrency());
//   }, [dispatch]);

//   return children;
// }

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
//         <Provider store={store}>
//           {/* <PersistGate loading={null} persistor={persistor}> */}
//             <Elements stripe={stripePromise}>
//               <CurrencyDetectorWrapper>
//                 {children}
//               </CurrencyDetectorWrapper>
//             </Elements>
//           {/* </PersistGate> */}
//         </Provider>
//       </body>
//     </html>
//   );
// }


'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './globals.css';
import Providers from '@/redux/Providers';

import { useDispatch } from 'react-redux';
//  import { store, persistor } from '@/redux/store';
import { detectCurrency } from '@/redux/currencySlice';
import { useEffect } from 'react';
// import { PersistGate } from 'redux-persist/integration/react'; // ✅ import this

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;
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
        <Providers>
          {/* <PersistGate loading={null} persistor={persistor}> */}
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CurrencyDetectorWrapper>
                  {children}
                </CurrencyDetectorWrapper>
              </Elements>
            ) : (
              <CurrencyDetectorWrapper>
                {children}
              </CurrencyDetectorWrapper>
            )}
          {/* </PersistGate> */}
        </Providers>
      </body>
    </html>
  );
}
