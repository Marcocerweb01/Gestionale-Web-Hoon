'use client';

import React, { useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from '@/Components/Header';
import { BookOpen, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DispensePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    } else if (status === "authenticated" && session?.user?.role !== "amministratore") {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "amministratore") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Link>
            
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Dispense e Guide
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Documenti utili e guide operative per la gestione della piattaforma
            </p>
          </div>

          {/* Placeholder Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Sezione in Costruzione
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Le dispense e le guide operative saranno presto disponibili in questa sezione.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
