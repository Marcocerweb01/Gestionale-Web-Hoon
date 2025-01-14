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
          <Link href={"/"}>
          <Image
            src="/hoon_logo.png"
            alt="Logo"
            width={150}
            height={100}
            className="object-contain"
          />
          </Link>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex items-center space-x-4">
          {status === "loading" ? (
            <p>Caricamento...</p>
          ) : session ? (
            // Mostra il pulsante Logout se l'utente è loggato
            <button
              onClick={() => signOut()}
              className="red_btn"
            >
              Logout
            </button>
          ) : (
            // Mostra il pulsante Accedi se l'utente non è loggato
            <Link href="/Login" passHref>
              <button className="black_btn">Accedi</button>
            </Link>
          )}
        </nav>
    </header>
  );
};

export default Header;
