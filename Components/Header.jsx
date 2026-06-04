'use client'
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { User, LogOut, ArrowLeft, Search, X } from "lucide-react";
import NotificheDropdown from "./NotificheDropdown";

const Header = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Salva i parametri della home in localStorage quando siamo sulla home
  useEffect(() => {
    if (pathname === "/" && searchParams.toString()) {
      localStorage.setItem("homeParams", searchParams.toString());
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
        if (!globalSearch.trim()) setSearchVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [globalSearch]);

  useEffect(() => {
    const term = globalSearch.trim();

    if (!session || term.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Errore ricerca");
        }

        const data = await response.json();
        setSearchResults(Array.isArray(data.results) ? data.results : []);
        setSearchOpen(true);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Errore ricerca globale:", error);
          setSearchResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [globalSearch, session]);
  
  // Funzione per tornare alla home preservando i parametri
  const handleHomeClick = () => {
    if (status !== "authenticated") {
      router.push("/Login");
      return;
    }
    
    // Se siamo sulla home, usa i parametri correnti
    if (pathname === "/") {
      const params = searchParams.toString();
      const homeUrl = params ? `/?${params}` : "/";
      router.push(homeUrl);
      return;
    }
    
    // Se siamo su altre pagine, recupera i parametri salvati da localStorage
    const savedParams = localStorage.getItem("homeParams");
    const homeUrl = savedParams ? `/?${savedParams}` : "/";
    router.push(homeUrl);
  };

  const handleSearchSelect = (href) => {
    setSearchOpen(false);
    setGlobalSearch("");
    setSearchResults([]);
    router.push(href);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter" && searchResults[0]) {
      event.preventDefault();
      handleSearchSelect(searchResults[0].href);
    }
    if (event.key === "Escape") {
      setSearchOpen(false);
    }
  };

  const clearSearch = () => {
    setGlobalSearch("");
    setSearchResults([]);
    setSearchOpen(false);
  };

  const showSearch = () => {
    setSearchVisible(true);
    setSearchOpen(globalSearch.trim().length >= 2);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Bottone Indietro */}
          <div className="flex items-center space-x-2">
            {/* Bottone Indietro */}
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Torna indietro"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Logo */}
            <button 
              onClick={handleHomeClick}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Image
                src="/hoon_logo.png"
                alt="Hoon Logo"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </button>
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
                <div className="relative" ref={searchRef}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={showSearch}
                      className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Cerca clienti, collaboratori e collaborazioni"
                    >
                      <Search className="w-4 h-4" />
                      <span className="hidden md:inline">Cerca</span>
                    </button>

                    <div
                      className={`${
                        searchVisible || globalSearch ? "block" : "hidden lg:block"
                      } absolute right-0 top-12 w-72 lg:static lg:w-auto`}
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="search"
                          value={globalSearch}
                          onChange={(event) => {
                            setGlobalSearch(event.target.value);
                            setSearchOpen(true);
                          }}
                          onFocus={() => setSearchOpen(globalSearch.trim().length >= 2)}
                          onKeyDown={handleSearchKeyDown}
                          placeholder="Cerca clienti, collaboratori..."
                          className="w-full lg:w-72 pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-lg lg:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {globalSearch && (
                          <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Svuota ricerca"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {searchOpen && globalSearch.trim().length >= 2 && (
                    <div className="absolute right-0 top-24 lg:top-12 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                      {searchLoading ? (
                        <div className="p-4 text-sm text-gray-500">Ricerca in corso...</div>
                      ) : searchResults.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                          {searchResults.map((result) => (
                            <button
                              key={`${result.type}-${result.id}`}
                              type="button"
                              onClick={() => handleSearchSelect(result.href)}
                              className="w-full text-left p-3 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 text-lg">{result.icon}</span>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {result.title}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {result.label}
                                    {result.subtitle ? ` · ${result.subtitle}` : ""}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-gray-500">Nessun risultato trovato</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Link Fatturazione - Solo per amministratori */}
                {(session.user.role === "amministratore" || session.user.role === "segretaria") && (
                  <Link 
                    href="/Fatturazione"
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    <span className="text-lg">💰</span>
                    <span className="hidden md:block">Fatturazione</span>
                  </Link>
                )}

                {/* Gestione Utenti - Solo amministratori */}
                {session.user.role === "amministratore" && (
                  <Link
                    href="/Gestione-Utenti"
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                  >
                    <span className="text-lg">🔐</span>
                    <span className="hidden md:block">Utenti</span>
                  </Link>
                )}

                {/* Campanella notifiche - Solo amministratori */}
                {session.user.role === "amministratore" && (
                  <NotificheDropdown />
                )}
                
                
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
