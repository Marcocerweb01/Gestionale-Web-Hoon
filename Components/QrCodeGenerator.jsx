'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, Copy, Check, Save } from 'lucide-react';
import QRCode from 'qrcode';

export default function QrCodeGenerator({ value, name, type, onSaved }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrCodeId, setQrCodeId] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState(null);
  const [localIP, setLocalIP] = useState('');

  useEffect(() => {
    // Rileva IP locale per testing
    detectLocalIP();
  }, []);

  useEffect(() => {
    if (value && canvasRef.current) {
      generateQR();
    }
  }, [value, trackingUrl]);

  const detectLocalIP = async () => {
    // In produzione usa origin normale, in dev mostra avviso
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) {
      setLocalIP(window.location.hostname);
    }
  };

  const generateQR = async () => {
    try {
      const canvas = canvasRef.current;
      
      // Usa tracking URL se disponibile (solo per URL), altrimenti valore normale
      let qrValue = trackingUrl && type === 'url' ? trackingUrl : value;
      
      // Formatta il valore in base al tipo
      if (type === 'email') {
        qrValue = `mailto:${value}`;
      } else if (type === 'phone') {
        qrValue = `tel:${value}`;
      }
      
      // Genera QR Code reale
      await QRCode.toCanvas(canvas, qrValue, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Errore generazione QR:', error);
    }
  };

  const downloadQR = async () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${name.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
  };

  const saveQRCode = async () => {
    if (saved) return; // Non salvare di nuovo se già salvato
    
    setSaving(true);
    try {
      const response = await fetch('/api/qrcode/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          value,
          createdAt: new Date()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeId(data.qrCodeId);
        setSaved(true);
        
        // Se è un URL, genera tracking URL e rigenera QR
        if (type === 'url') {
          const baseUrl = window.location.origin;
          const newTrackingUrl = `${baseUrl}/api/qrcode/redirect/${data.qrCodeId}`;
          setTrackingUrl(newTrackingUrl);
        }
        
        if (onSaved) onSaved(data.qrCodeId);
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio del QR Code');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (error) {
      console.error('Errore copia:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Badge stato salvataggio */}
      {saving && (
        <div className="mb-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Salvataggio in corso...
        </div>
      )}
      
      {saved && !saving && (
        <div className="mb-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {trackingUrl ? 'QR Code salvato con tracking attivo!' : 'QR Code salvato!'}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="border border-gray-200 rounded-lg mb-4"
      />

      <div className="space-y-3 w-full">
        {/* Bottone Salva */}
        {!saved && (
          <button
            onClick={saveQRCode}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salva QR Code
              </>
            )}
          </button>
        )}

        {/* Bottoni Download e Copia */}
        <div className="flex gap-3 w-full">
          <button
            onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiato!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copia
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 w-full bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-1"><strong>Nome:</strong> {name}</p>
        <p className="text-sm text-gray-600 mb-1"><strong>Tipo:</strong> {type}</p>
        <p className="text-sm text-gray-600 break-all"><strong>Contenuto:</strong> {value}</p>
        {trackingUrl && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-green-600 mb-1">🎯 <strong>Tracking Attivo</strong></p>
            <p className="text-xs text-gray-500 break-all">Il QR redirige tramite: {trackingUrl}</p>
            {localIP === 'localhost' && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Localhost</strong>: Il tracking funzionerà solo in produzione o usando l'IP locale della tua rete (es: 192.168.1.x:3000) invece di localhost.
                  Per testare, avvia il server con <code className="bg-yellow-100 px-1 rounded">npm run dev -- -H 0.0.0.0</code> e usa l'IP del PC nella rete.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
