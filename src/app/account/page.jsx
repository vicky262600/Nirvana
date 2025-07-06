// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useSelector, useDispatch } from 'react-redux';
// import { logout } from '@/redux/authSlice'; // assuming you have this
// import { Header } from '@/components/header/Header';
// import { Footer } from '@/components/footer/Footer';
// import { Button } from '@/components/ui/button';

// export default function AccountPage() {
//   const router = useRouter();
//   const dispatch = useDispatch();
//   const user = useSelector((state) => state.auth.user); // adjust if using another structure

//   useEffect(() => {
//     if (!user) {
//       router.push('/login'); // redirect if not logged in
//     }
//   }, [user, router]);

//   const handleLogout = () => {
//     dispatch(logout());
//     router.push('/');
//   };

//   if (!user) return null;

//   return (
//     <>
//       <Header />
//       <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-160px)]">
//         <h1 className="text-3xl font-bold mb-6">Account Overview</h1>

//         <div className="bg-white p-6 rounded-lg shadow mb-8">
//           <h2 className="text-xl font-semibold mb-2">Welcome, {user.firstName} {user.lastName}</h2>
//           <p className="text-gray-700">Email: {user.email}</p>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow">
//           <h2 className="text-xl font-semibold mb-4">Order History</h2>
//           {/* Replace this with dynamic orders from your backend */}
//           <p className="text-gray-600">No orders yet.</p>
//         </div>

//         <div className="mt-8">
//           <Button onClick={handleLogout}>Logout</Button>
//         </div>
//       </main>
//       <Footer />
//     </>
//   );
// }
import React from 'react'

const accountPage = () => {
  return (
    <div>accountPage</div>
  )
}

export default accountPage