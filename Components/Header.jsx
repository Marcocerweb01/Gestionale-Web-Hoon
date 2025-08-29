'use client'
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Menu } from "lucide-react";

const Header = () => {
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={status === "authenticated" ? "/" : "/Login"} className="flex items-center space-x-2">
              <Image
                src="/hoon_logo.png"
                alt="Hoon Logo"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Caricamento...</span>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                {/* User info */}
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                  <User className="w-4 h-4" />
                  <span>Ciao, {session.user.nome}</span>
                </div>
                
                {/* Logout button */}
                <button
                  onClick={() => signOut({ callbackUrl: '/Login' })}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            ) : (
              <Link href="/Login" passHref>
                <button className="inline-flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                  <User className="w-4 h-4" />
                  <span>Accedi</span>
                </button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;