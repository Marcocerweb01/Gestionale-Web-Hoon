import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import ImageCompression from '@/models/ImageCompression';
import mongoose from 'mongoose';
import sharp from 'sharp';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const formData = await req.formData();
    const image = formData.get('image');
    const quality = parseInt(formData.get('quality') || 75);
    const maxWidth = parseInt(formData.get('maxWidth') || 2000);
    const format = formData.get('format') || 'webp'; // webp, jpeg, png

    if (!image) {
      return NextResponse.json({ error: 'Nessuna immagine fornita' }, { status: 400 });
    }

    // Converti il file in buffer
    const buffer = Buffer.from(await image.arrayBuffer());
    const originalSize = buffer.length;

    // Ottieni info immagine
    const metadata = await sharp(buffer).metadata();
    
    // Pipeline di compressione intelligente
    let pipeline = sharp(buffer)
      .rotate() // Auto-rotazione da EXIF
      .withMetadata(false); // Rimuovi tutti i metadati (risparmio ~5-10%)

    // Resize intelligente se l'immagine è troppo grande
    if (metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Applica compressione in base al formato richiesto
    let compressedBuffer;
    let outputFormat = format;
    
    if (format === 'webp') {
      compressedBuffer = await pipeline
        .webp({ 
          quality, 
          effort: 6, // Max effort per miglior compressione (0-6)
          smartSubsample: true
        })
        .toBuffer();
    } else if (format === 'jpeg') {
      compressedBuffer = await pipeline
        .jpeg({ 
          quality, 
          mozjpeg: true,
          chromaSubsampling: '4:2:0' // Migliore compressione
        })
        .toBuffer();
    } else {
      // PNG con compressione aggressiva
      compressedBuffer = await pipeline
        .png({ 
          quality,
          compressionLevel: 9, // Max compressione
          palette: true, // Usa palette se possibile
          effort: 10 // Max effort
        })
        .toBuffer();
    }

    const compressedSize = compressedBuffer.length;
    const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    // Salva statistiche nel database
    await connectToDB();
    await ImageCompression.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      originalName: image.name,
      originalSize,
      compressedSize,
      quality,
      savings,
      format: outputFormat
    });

    // Determina estensione file
    const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const filename = image.name.replace(/\.[^/.]+$/, '') + `_compressed.${ext}`;

    // Restituisci l'immagine compressa
    return new NextResponse(compressedBuffer, {
      headers: {
        'Content-Type': `image/${outputFormat}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Savings': `${savings}%`,
        'X-Original-Dimensions': `${metadata.width}x${metadata.height}`
      }
    });
  } catch (error) {
    console.error('Errore compressione immagine:', error);
    return NextResponse.json({ 
      error: 'Errore durante la compressione' 
    }, { status: 500 });
  }
}

// Statistiche compressioni
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await connectToDB();
    
    const stats = await ImageCompression.aggregate([
      { $match: { userId: session.user.id } },
      {
        $group: {
          _id: null,
          totalCompressed: { $sum: 1 },
          totalOriginalSize: { $sum: '$originalSize' },
          totalCompressedSize: { $sum: '$compressedSize' },
          avgSavings: { $avg: '$savings' }
        }
      }
    ]);

    return NextResponse.json(stats[0] || {
      totalCompressed: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      avgSavings: 0
    });
  } catch (error) {
    console.error('Errore recupero stats:', error);
    return NextResponse.json({ 
      error: 'Errore recupero dati' 
    }, { status: 500 });
  }
}
