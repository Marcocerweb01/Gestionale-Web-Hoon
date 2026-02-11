import { connectToDB } from '@/utils/database';
import QrCode from '@/models/QrCode';
import { NextResponse } from 'next/server';

// POST /api/qrcode/scan/[id] - Incrementa contatore scansioni
export async function POST(req, { params }) {
  try {
    await connectToDB();
    
    const { id } = await params;
    
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
    
    return NextResponse.json({ 
      success: true, 
      scans: qrCode.scans 
    });
    
  } catch (error) {
    console.error('Errore tracking scan:', error);
    return NextResponse.json(
      { error: 'Errore nel tracking della scansione' },
      { status: 500 }
    );
  }
}
