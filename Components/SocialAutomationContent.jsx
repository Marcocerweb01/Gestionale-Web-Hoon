'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Share2, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Plus,
  RefreshCw,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function SocialAutomationContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/Login');
    }
    
    if (session) {
      loadAccounts();
    }

    // Controlla messaggi da OAuth callback
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const accountCount = searchParams.get('accounts');

    if (success) {
      setMessage({
        type: 'success',
        text: `✅ ${accountCount || 'Account'} connesso/i con successo!`
      });
      // Pulisci URL
      window.history.replaceState({}, '', '/Operations/SocialAutomation');
    }

    if (error) {
      setMessage({
        type: 'error',
        text: `❌ Errore: ${decodeURIComponent(error)}`
      });
      window.history.replaceState({}, '', '/Operations/SocialAutomation');
    }
  }, [session, searchParams, status, router]);

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/social-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_META_REDIRECT_URI);
    
    const scopes = [
      'instagram_basic',
      'instagram_manage_comments',
      'instagram_manage_messages',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Sei sicuro di voler disconnettere questo account?')) return;

    try {
      const res = await fetch(`/api/social-accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Account disconnesso' });
        loadAccounts();
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Errore disconnessione account' });
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return <Share2 className="w-5 h-5" />;
    }
  };

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'instagram': return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'facebook': return 'bg-blue-600';
      case 'linkedin': return 'bg-blue-700';
      case 'youtube': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <CheckCircle className="w-3 h-3" />
          Attivo
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
        <XCircle className="w-3 h-3" />
        Inattivo
        </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Social Media Automation
          </h1>
          <p className="text-gray-600">
            Gestisci i tuoi account social e automatizza le risposte
          </p>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="ml-auto text-sm hover:underline"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Connect Account Button */}
        <div className="mb-6">
          <button
            onClick={handleConnectAccount}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Connetti Account
          </button>
        </div>

        {/* Connected Accounts */}
        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun account connesso
            </h3>
            <p className="text-gray-600 mb-6">
              Connetti i tuoi account social per iniziare ad automatizzare le risposte
            </p>
            <button
              onClick={handleConnectAccount}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Connetti Primo Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => {
              const isInstagram = account.accountType === 'instagram';
              const isFacebook = account.accountType === 'facebook';
              
              return (
                <div
                  key={account._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Account Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${getProviderColor(account.accountType)} text-white p-3 rounded-lg`}>
                      {getProviderIcon(account.accountType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {account.username || account.pageName}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {account.accountType}
                      </p>
                    </div>
                    {getStatusBadge(account.isActive)}
                  </div>

                  {/* Account Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {account.accountId && (
                      <p>ID: {account.accountId.substring(0, 12)}...</p>
                    )}
                    <p>
                      Connesso: {new Date(account.connectedAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/Operations/SocialAutomation/${account._id}/rules`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      Regole
                    </button>
                    <button
                      onClick={() => loadAccounts()}
                      className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account._id)}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
