import { connectToDB } from '@/utils/database';
import QrCode from '@/models/QrCode';
import { after, NextResponse } from 'next/server';

// GET /api/qrcode/redirect/[id] - Incrementa scan e redirige
export async function GET(req, { params }) {
  try {
    await connectToDB();
    
    const { id } = await params;
    
    const qrCode = await QrCode.findById(id).select('value').lean();
    
    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR Code non trovato' },
        { status: 404 }
      );
    }

    after(async () => {
      try {
        await QrCode.findByIdAndUpdate(id, {
          $inc: { scans: 1 },
          lastScan: new Date()
        });
      } catch (error) {
        console.error('Errore tracking scan post-redirect:', error);
      }
    });
    
    // Redirige all'URL originale
    return NextResponse.redirect(qrCode.value, 302);
    
  } catch (error) {
    console.error('Errore redirect scan:', error);
    return NextResponse.json(
      { error: 'Errore nel tracking della scansione' },
      { status: 500 }
    );
  }
}
