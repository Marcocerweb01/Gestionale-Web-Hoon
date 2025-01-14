import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const Header = () => {
  const { data: session, status } = useSession();

  return (
    <header className="header_style">
      {/* Logo */}
      <div className="flex items-center">
        <Link href={status === "authenticated" ? "/" : "/Login"}>
          <Image
            src="/hoon_logo.png"
            alt="Logo"
            width={150}
            height={100}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex items-center space-x-4">
        {status === "loading" ? (
          <p>Caricamento...</p>
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
  );
};

export default Header;