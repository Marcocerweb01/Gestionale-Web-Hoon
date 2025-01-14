import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const Header = () => {
  const { data: session, status } = useSession();

  return (
    <div className="w-full flex justify-center px-6 fixed top-2 z-50">
      <header className="w-full max-w-6xl bg-white shadow-md rounded-lg flex items-center justify-between px-6 py-4">
        {/* Logo Container */}
        <div className="relative flex items-center">
          <Link href={status === "authenticated" ? "/" : "/Login"}>
            <div className="relative w-[150px] h-[100px] flex items-center">
              <Image
                src="/hoon_logo.png"
                alt="Logo"
                width={150}
                height={100}
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex items-center space-x-4">
          {status === "loading" ? (
            <p className="text-gray-600">Caricamento...</p>
          ) : session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/Login' })}
              className="red_btn"
            >
              Logout
            </button>
          ) : (
            <Link href="/Login" passHref>
              <button className="black_btn">Accedi</button>
            </Link>
          )}
        </nav>
      </header>
    </div>
  );
};

export default Header;