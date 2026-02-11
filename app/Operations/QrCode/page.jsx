'use client';
import { useState, useEffect } from 'react';
import { QrCode, Download, Link as LinkIcon, Mail, Wifi, Phone, Trash2 } from 'lucide-react';
import QRCodeGenerator from '@/Components/QrCodeGenerator';

export default function QrCodePage() {
  const [qrType, setQrType] = useState('url');
  const [qrData, setQrData] = useState('');
  const [qrName, setQrName] = useState('');
  const [generated, setGenerated] = useState(false);
  const [savedQRCodes, setSavedQRCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedQRCodes();
  }, []);

  const loadSavedQRCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/qrcode/save');
      if (response.ok) {
        const data = await response.json();
        setSavedQRCodes(data);
      }
    } catch (error) {
      console.error('Errore caricamento QR salvati:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSimulation = async (qrId) => {
    try {
      const response = await fetch(`/api/qrcode/scan/${qrId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Ricarica la lista per mostrare il contatore aggiornato
        loadSavedQRCodes();
      }
    } catch (error) {
      console.error('Errore simulazione scan:', error);
    }
  };

  const handleQRSaved = (qrCodeId) => {
    // Ricarica la lista dopo il salvataggio
    loadSavedQRCodes();
  };

  const qrTypes = [
    { id: 'url', label: 'URL/Link', icon: LinkIcon, placeholder: 'https://esempio.com' },
    { id: 'text', label: 'Testo', icon: QrCode, placeholder: 'Inserisci testo...' },
    { id: 'email', label: 'Email', icon: Mail, placeholder: 'email@esempio.com' },
    { id: 'phone', label: 'Telefono', icon: Phone, placeholder: '+39 123 456 7890' },
    { id: 'wifi', label: 'WiFi', icon: Wifi, placeholder: 'Nome rete' }
  ];

  const handleGenerate = () => {
    if (qrData.trim()) {
      setGenerated(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
          </div>
          <p className="text-gray-600">
            Crea QR code personalizzati con tracking e analytics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Configura QR Code</h2>

            {/* Nome QR */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome QR Code (per identificarlo)
              </label>
              <input
                type="text"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                placeholder="Es: Menu Ristorante, Biglietto Visita..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Tipo QR */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo di QR Code
              </label>
              <div className="grid grid-cols-2 gap-3">
                {qrTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setQrType(type.id);
                        setQrData('');
                        setGenerated(false);
                      }}
                      className={`
                        flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                        ${qrType === type.id 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Dati */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {qrTypes.find(t => t.id === qrType)?.label || 'Contenuto'}
              </label>
              
              {qrType === 'wifi' ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome rete WiFi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Nessuna Password</option>
                  </select>
                </div>
              ) : (
                <textarea
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder={qrTypes.find(t => t.id === qrType)?.placeholder}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!qrData.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Genera QR Code
            </button>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Anteprima</h2>
            
            {generated && qrData ? (
              <QRCodeGenerator 
                value={qrData} 
                name={qrName || 'QR Code'}
                type={qrType}
                onSaved={handleQRSaved}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
                <QrCode className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center">
                  Il tuo QR Code apparirà qui<br />
                  <span className="text-sm">Compila il form e clicca "Genera"</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lista QR Generati */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            QR Code Salvati ({savedQRCodes.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : savedQRCodes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>Nessun QR code salvato ancora</p>
              <p className="text-sm mt-2">I QR code generati appariranno qui</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedQRCodes.map((qr) => (
                <div key={qr._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{qr.name}</h3>
                      <span className="text-xs text-gray-500 uppercase">{qr.type}</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Eliminare questo QR Code?')) {
                          try {
                            await fetch(`/api/qrcode/save?id=${qr._id}`, { method: 'DELETE' });
                            loadSavedQRCodes();
                          } catch (error) {
                            console.error('Errore eliminazione:', error);
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="bg-gray-100 p-2 rounded mb-3">
                    <p className="text-xs text-gray-600 truncate">{qr.value}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Scans: {qr.scans || 0}</span>
                    <span>{new Date(qr.createdAt).toLocaleDateString('it-IT')}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setQrName(qr.name);
                        setQrType(qr.type);
                        setQrData(qr.value);
                        setGenerated(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                    >
                      Visualizza
                    </button>
                    <button
                      onClick={() => handleScanSimulation(qr._id)}
                      className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      Test Scan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
