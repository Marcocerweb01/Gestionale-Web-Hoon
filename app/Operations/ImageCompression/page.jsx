'use client';
import { useState, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function ImageCompressionPage() {
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState('webp');
  const [maxWidth, setMaxWidth] = useState(2000);

  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36),
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      compressedSize: null,
      compressed: false,
      downloadUrl: null
    }));
    
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    }
  });

  const compressImages = async () => {
    setCompressing(true);
    
    for (let i = 0; i < images.length; i++) {
      if (!images[i].compressed) {
        const formData = new FormData();
        formData.append('image', images[i].file);
        formData.append('quality', quality);
        formData.append('format', format);
        formData.append('maxWidth', maxWidth);

        try {
          const response = await fetch('/api/compress-image', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Estrai info dagli headers
            const savings = response.headers.get('X-Savings') || '0%';
            const contentDisposition = response.headers.get('Content-Disposition');
            
            // Estrai il filename dall'header Content-Disposition
            let filename = `compressed_${images[i].file.name}`;
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="(.+)"/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }
            }
            
            setImages(prev => prev.map(img => 
              img.id === images[i].id 
                ? {
                    ...img,
                    compressedSize: blob.size,
                    compressed: true,
                    downloadUrl: url,
                    downloadFilename: filename,
                    savings: savings
                  }
                : img
            ));
          }
        } catch (error) {
          console.error('Errore compressione:', error);
        }
      }
    }
    
    setCompressing(false);
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const calculateSavings = (original, compressed) => {
    if (!compressed) return 0;
    return Math.round(((original - compressed) / original) * 100);
  };

  const totalOriginalSize = images.reduce((acc, img) => acc + img.originalSize, 0);
  const totalCompressedSize = images.reduce((acc, img) => acc + (img.compressedSize || 0), 0);
  const totalSavings = totalOriginalSize > 0 
    ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Compressione Immagini</h1>
          </div>
          <p className="text-gray-600">
            Comprimi e ottimizza le tue immagini mantenendo la qualità
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive 
                ? 'Rilascia le immagini qui...' 
                : 'Trascina immagini qui o clicca per selezionare'
              }
            </p>
            <p className="text-sm text-gray-500">
              Supporta: PNG, JPG, JPEG, WEBP, GIF
            </p>
          </div>

          {/* Settings */}
          {images.length > 0 && (
            <div className="mt-6 space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato Output
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setFormat('webp')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      format === 'webp'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    WebP (Migliore)
                  </button>
                  <button
                    onClick={() => setFormat('jpeg')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      format === 'jpeg'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    JPEG
                  </button>
                  <button
                    onClick={() => setFormat('png')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      format === 'png'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    PNG
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  WebP offre 25-35% di compressione in più rispetto a JPEG
                </p>
              </div>

              {/* Quality Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualità: {quality}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Più piccolo (10%)</span>
                  <span>Migliore qualità (100%)</span>
                </div>
              </div>

              {/* Max Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Larghezza Massima: {maxWidth}px
                </label>
                <input
                  type="range"
                  min="800"
                  max="4000"
                  step="200"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mobile (800px)</span>
                  <span>4K (4000px)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {images.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-4 mb-6">
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-gray-900">
                  {formatSize(totalOriginalSize)}
                </div>
                <div className="text-sm text-gray-600">Originale</div>
              </div>
              
              <div className="text-2xl text-gray-400">→</div>
              
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-blue-600">
                  {formatSize(totalCompressedSize)}
                </div>
                <div className="text-sm text-gray-600">Compressa</div>
              </div>
              
              <div className="text-2xl text-gray-400">=</div>
              
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-green-600">
                  {totalSavings}%
                </div>
                <div className="text-sm text-gray-600">Risparmio</div>
              </div>
            </div>
          </div>
        )}

        {/* Images List */}
        {images.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Immagini ({images.length})
              </h2>
              <button
                onClick={compressImages}
                disabled={compressing || images.every(img => img.compressed)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {compressing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Compressione...
                  </>
                ) : (
                  <>Comprimi Tutte</>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {images.map((image) => (
                <div key={image.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  {/* Preview */}
                  <img 
                    src={image.preview} 
                    alt={image.file.name}
                    className="w-20 h-20 object-cover rounded"
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {image.file.name}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span>Originale: {formatSize(image.originalSize)}</span>
                      {image.compressed && (
                        <>
                          <span>→</span>
                          <span className="text-blue-600 font-medium">
                            Compressa: {formatSize(image.compressedSize)}
                          </span>
                          <span className="text-green-600 font-medium">
                            (-{image.savings || calculateSavings(image.originalSize, image.compressedSize) + '%'})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {image.compressed && (
                      <a
                        href={image.downloadUrl}
                        download={image.downloadFilename || `compressed_${image.file.name}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Rimuovi"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
