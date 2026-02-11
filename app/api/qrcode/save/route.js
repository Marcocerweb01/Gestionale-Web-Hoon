import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDB } from '@/utils/database';
import QrCode from '@/models/QrCode';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await connectToDB();
    
    const data = await req.json();
    const { name, type, value, wifiConfig } = data;

    // Crea record nel database
    const qrCode = await QrCode.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      name,
      type,
      value,
      wifiConfig: type === 'wifi' ? wifiConfig : undefined
    });

    return NextResponse.json({ 
      success: true, 
      qrCodeId: qrCode._id 
    });
  } catch (error) {
    console.error('Errore salvataggio QR Code:', error);
    return NextResponse.json({ 
      error: 'Errore salvataggio' 
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await connectToDB();
    
    const qrCodes = await QrCode.find({ 
      userId: session.user.id 
    }).sort({ createdAt: -1 });

    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error('Errore recupero QR Codes:', error);
    return NextResponse.json({ 
      error: 'Errore recupero dati' 
    }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    }

    await connectToDB();
    
    await QrCode.findOneAndDelete({ 
      _id: id,
      userId: session.user.id 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione QR Code:', error);
    return NextResponse.json({ 
      error: 'Errore eliminazione' 
    }, { status: 500 });
  }
}
