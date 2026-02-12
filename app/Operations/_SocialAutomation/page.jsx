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

export const dynamic = 'force-dynamic';

export default function SocialAutomationPage() {
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
  }, [status, router, session, searchParams]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social-accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Errore caricamento account:', error);
      setMessage({ type: 'error', text: 'Errore caricamento account' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMeta = () => {
    // Redirect a Meta OAuth
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_META_REDIRECT_URI || `${window.location.origin}/api/oauth/meta/callback`);
    const scope = encodeURIComponent('pages_manage_posts,pages_read_engagement,pages_manage_engagement,pages_messaging,instagram_basic,instagram_manage_comments,instagram_manage_messages,instagram_content_publish');
    
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    window.location.href = oauthUrl;
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Sei sicuro di voler disconnettere questo account?')) return;

    try {
      const response = await fetch(`/api/social-accounts?id=${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Account disconnesso' });
        loadAccounts();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Errore disconnessione' });
      }
    } catch (error) {
      console.error('Errore disconnessione:', error);
      setMessage({ type: 'error', text: 'Errore disconnessione account' });
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'linkedin': return Linkedin;
      case 'youtube': return Youtube;
      default: return Share2;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'instagram': return 'bg-pink-100 text-pink-600';
      case 'facebook': return 'bg-blue-100 text-blue-600';
      case 'linkedin': return 'bg-blue-700 text-white';
      case 'youtube': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="w-8 h-8 text-pink-600" />
                <h1 className="text-3xl font-bold text-gray-900">Social Automation</h1>
              </div>
              <p className="text-gray-600">
                Gestisci account social e automazioni
              </p>
            </div>
            <button
              onClick={handleConnectMeta}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Connetti Account
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {message.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            {message.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {message.text}
            </p>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Account List */}
        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-10 h-10 text-pink-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Nessun account connesso
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Connetti i tuoi account Instagram e Facebook per iniziare ad automatizzare le interazioni
            </p>

            <button
              onClick={handleConnectMeta}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Connetti Primo Account
            </button>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Auto-Reply Commenti</h3>
                  <p className="text-sm text-gray-600">
                    Rispondi automaticamente ai commenti con keyword specifiche
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">DM Automatici</h3>
                  <p className="text-sm text-gray-600">
                    Invia messaggi automatici a nuovi follower
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Post Programmati</h3>
                  <p className="text-sm text-gray-600">
                    Programma post su multiple piattaforme
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Multi-Account</h3>
                  <p className="text-sm text-gray-600">
                    Gestisci più account dalla stessa dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-3xl font-bold text-gray-900 mb-1">{accounts.length}</div>
                <div className="text-sm text-gray-600">Account Connessi</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {accounts.filter(a => a.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Attivi</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-3xl font-bold text-pink-600 mb-1">
                  {accounts.filter(a => a.platform === 'instagram').length}
                </div>
                <div className="text-sm text-gray-600">Instagram</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {accounts.filter(a => a.platform === 'facebook').length}
                </div>
                <div className="text-sm text-gray-600">Facebook</div>
              </div>
            </div>

            {/* Account Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((account) => {
                const PlatformIcon = getPlatformIcon(account.platform);
                const isExpiringSoon = account.tokenExpiry && 
                  new Date(account.tokenExpiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                return (
                  <div key={account._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {account.profilePicture ? (
                        <img
                          src={account.profilePicture}
                          alt={account.username}
                          className="w-16 h-16 rounded-full"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getPlatformColor(account.platform)}`}>
                          <PlatformIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {account.displayName}
                          </h3>
                          {account.status === 'active' ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : account.status === 'expired' ? (
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{account.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(account.platform)}`}>
                            <PlatformIcon className="w-3 h-3" />
                            {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    {account.stats && (
                      <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {account.stats.followers?.toLocaleString() || '-'}
                          </div>
                          <div className="text-xs text-gray-500">Follower</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {account.stats.following?.toLocaleString() || '-'}
                          </div>
                          <div className="text-xs text-gray-500">Following</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {account.stats.posts?.toLocaleString() || '-'}
                          </div>
                          <div className="text-xs text-gray-500">Post</div>
                        </div>
                      </div>
                    )}

                    {/* Warning token expiring */}
                    {isExpiringSoon && (
                      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs text-orange-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Token in scadenza - Riconnetti account
                        </p>
                      </div>
                    )}

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
          </div>
        )}
      </div>
    </div>
  );
}
