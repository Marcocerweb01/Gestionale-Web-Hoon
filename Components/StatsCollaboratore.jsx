"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Percent, FileText } from "lucide-react";

export default function StatsCollaboratore({ collaboratoreId }) {
  const [collaboratore, setCollaboratore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (collaboratoreId) {
      fetchCollaboratore();
    }
  }, [collaboratoreId]);

  const fetchCollaboratore = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${collaboratoreId}`);
      if (response.ok) {
        const data = await response.json();
        setCollaboratore(data);
      }
    } catch (error) {
      console.error("Errore caricamento collaboratore:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!collaboratore) {
    return null;
  }

  const stats = [
    {
      label: "Percentuale Hoon",
      value: `${collaboratore.percentuale_hoon || 50}%`,
      icon: Percent,
      color: "blue",
      description: "Percentuale guadagno su clienti Hoon"
    },
    {
      label: "Totale Fatturato",
      value: `€ ${(collaboratore.tot_fatturato || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "green",
      description: "Fatturato totale generato"
    },
    {
      label: "Guadagno da Hoon",
      value: `€ ${(collaboratore.guadagno_da_hoon || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "emerald",
      description: "Guadagni da collaborazioni Hoon"
    },
    {
      label: "Fatture a Terzi",
      value: `€ ${(collaboratore.totale_fatture_terzi || 0).toFixed(2)}`,
      icon: FileText,
      color: "purple",
      description: "Fatturazioni verso terzi"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50",
      green: "from-green-500 to-green-600 text-green-600 bg-green-50",
      emerald: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50",
      purple: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
        Statistiche Finanziarie
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = getColorClasses(stat.color);
          
          return (
            <div
              key={index}
              className={`rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses.split(' ').slice(-1)}`}>
                  <Icon className={`w-5 h-5 ${colorClasses.split(' ').slice(-2, -1)}`} />
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                  {stat.label}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totale Combinato */}
      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Totale Complessivo</p>
            <p className="text-2xl md:text-3xl font-bold">
              € {((collaboratore.tot_fatturato || 0)).toFixed(2)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 md:w-10 md:h-10 opacity-75" />
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="opacity-75">Da Hoon</p>
            <p className="font-semibold">
              {collaboratore.tot_fatturato > 0 
                ? ((collaboratore.guadagno_da_hoon / collaboratore.tot_fatturato) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="opacity-75">Da Terzi</p>
            <p className="font-semibold">
              {collaboratore.tot_fatturato > 0 
                ? ((collaboratore.totale_fatture_terzi / collaboratore.tot_fatturato) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
