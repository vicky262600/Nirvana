'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import CurrencySelector from '../currencySelector/CurrencySelector';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = useSelector((state) => state.cart.items || []);
  const user = useSelector((state) => state.user.currentUser);

  const itemCount = items.reduce((sum, item) => sum + item.selectedQuantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 relative">
          
          {/* Left - Desktop: Fall Collection | Mobile: Menu */}
          <div className="flex items-center">
            {/* Desktop */}
            <Link
              href="/#fall-collection"
              className="hidden md:block text-gray-700 hover:text-black font-medium transition-colors"
            >
              Fall Collection
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Center - Brand */}
          <Link
            href="/"
            className="absolute left-1/2 transform -translate-x-1/2 text-lg sm:text-xl md:text-2xl font-bold text-black hover:text-gray-700 transition-colors z-10"
          >
            EMBROSOUL
          </Link>

          {/* Right - Account & Cart */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            {/* Hide User icon on mobile, show only on md+ */}
            <Link href={user ? "/account" : "/login"} className="hidden md:block">
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/cart" className="relative">
              <Button variant="ghost" size="sm">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            <CurrencySelector />
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/#fall-collection"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-black transition-colors font-medium"
              >
                Fall Collection
              </Link>

              {/* Mobile-only Account Button */}
              <hr className="border-gray-300 border-t-[1px]"/>
              <Link href={user ? "/account" : "/login"} onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account
                </Button>
              </Link>

            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
