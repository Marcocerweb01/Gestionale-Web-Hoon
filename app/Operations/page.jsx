'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  Image as ImageIcon, 
  Share2, 
  BarChart3,
  Sparkles 
} from 'lucide-react';

export default function OperationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    qrCodes: 0,
    images: 0,
    automations: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/Login');
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'amministratore') {
      router.push('/unauthorized');
    }
    
    if (session && session.user.role === 'amministratore') {
      loadStats();
    }
  }, [status, router, session]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      // Carica statistiche QR Code
      const qrResponse = await fetch('/api/qrcode/save');
      const qrData = await qrResponse.ok ? await qrResponse.json() : [];
      
      // Somma tutte le scan di tutti i QR code
      const totalScans = Array.isArray(qrData) 
        ? qrData.reduce((sum, qr) => sum + (qr.scans || 0), 0)
        : 0;
      
      // Carica statistiche Image Compression
      const imgResponse = await fetch('/api/compress-image');
      const imgData = await imgResponse.ok ? await imgResponse.json() : { totalCompressed: 0 };
      
      setStats({
        qrCodes: totalScans,
        images: imgData.totalCompressed || 0,
        automations: 0 // TODO: implementare quando ci sarà social automation
      });
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const tools = [
    {
      id: 'qrcode',
      name: 'QR Code Generator',
      description: 'Crea QR code personalizzati con analytics e tracking',
      icon: QrCode,
      href: '/Operations/QrCode',
      color: 'bg-purple-500',
      status: 'active'
    },
    {
      id: 'image-compression',
      name: 'Compressione Immagini',
      description: 'Comprimi e ottimizza immagini mantenendo la qualità',
      icon: ImageIcon,
      href: '/Operations/ImageCompression',
      color: 'bg-blue-500',
      status: 'active'
    },
    {
      id: 'social-automation',
      name: 'Social Automation',
      description: 'Automazioni per Instagram, Facebook e altri social',
      icon: Share2,
      href: '/Operations/SocialAutomation',
      color: 'bg-pink-500',
      status: 'coming-soon'
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Statistiche e metriche di tutti gli strumenti',
      icon: BarChart3,
      href: '/Operations/Analytics',
      color: 'bg-green-500',
      status: 'coming-soon'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Operations</h1>
          </div>
          <p className="text-gray-600">
            Strumenti avanzati per gestire clienti e operazioni
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = tool.status === 'active';

            return (
              <Link
                key={tool.id}
                href={isActive ? tool.href : '#'}
                className={`
                  relative bg-white rounded-xl shadow-md p-6 
                  transition-all duration-200
                  ${isActive 
                    ? 'hover:shadow-xl hover:scale-105 cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed'
                  }
                `}
                onClick={(e) => !isActive && e.preventDefault()}
              >
                {/* Status Badge */}
                {!isActive && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`${tool.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {tool.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {tool.description}
                </p>

                {/* Arrow */}
                {isActive && (
                  <div className="mt-4 flex items-center text-blue-600 font-medium text-sm">
                    Apri strumento
                    <svg 
                      className="w-4 h-4 ml-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Statistiche Rapide
          </h2>
          {loadingStats ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.qrCodes}</div>
                <div className="text-sm text-gray-600 mt-1">Scansioni QR Code</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.images}</div>
                <div className="text-sm text-gray-600 mt-1">Immagini Compresse</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">{stats.automations}</div>
                <div className="text-sm text-gray-600 mt-1">Automazioni Attive</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
