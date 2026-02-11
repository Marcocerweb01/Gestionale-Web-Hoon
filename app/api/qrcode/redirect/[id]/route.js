import { connectToDB } from '@/utils/database';
import QrCode from '@/models/QrCode';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

// GET /api/qrcode/redirect/[id] - Incrementa scan e redirige
export async function GET(req, { params }) {
  try {
    await connectToDB();
    
    const { id } = await params;
    
    // Incrementa il contatore
    const qrCode = await QrCode.findByIdAndUpdate(
      id,
      { 
        $inc: { scans: 1 },
        lastScan: new Date()
      },
      { new: true }
    );
    
    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR Code non trovato' },
        { status: 404 }
      );
    }
    
    // Redirige all'URL originale
    return NextResponse.redirect(qrCode.value);
    
  } catch (error) {
    console.error('Errore redirect scan:', error);
    return NextResponse.json(
      { error: 'Errore nel tracking della scansione' },
      { status: 500 }
    );
  }
}
