'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Menu, X, Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = useSelector((state) => state.cart.items || []);

  // Compute item count here so it's usable in JSX
  const itemCount = items.reduce((sum, item) => sum + item.selectedQuantity, 0);
  console.log(itemCount);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-black hover:text-gray-700 transition-colors">
            NIRVANA
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/shop" className="text-gray-700 hover:text-black transition-colors">Shop</Link>
            <Link href="/men" className="text-gray-700 hover:text-black transition-colors">Men</Link>
            <Link href="/women" className="text-gray-700 hover:text-black transition-colors">Women</Link>
            <Link href="/accessories" className="text-gray-700 hover:text-black transition-colors">Accessories</Link>
            <Link href="/sale" className="text-red-600 hover:text-red-700 transition-colors font-medium">Sale</Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="h-5 w-5" />
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="sm">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <Link href="/shop" className="text-gray-700 hover:text-black transition-colors">Shop</Link>
              <Link href="/men" className="text-gray-700 hover:text-black transition-colors">Men</Link>
              <Link href="/women" className="text-gray-700 hover:text-black transition-colors">Women</Link>
              <Link href="/accessories" className="text-gray-700 hover:text-black transition-colors">Accessories</Link>
              <Link href="/sale" className="text-red-600 hover:text-red-700 transition-colors font-medium">Sale</Link>
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Account
                  </Button>
                </Link>
                <Link href="/cart" className="relative">
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Cart ({itemCount})
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};