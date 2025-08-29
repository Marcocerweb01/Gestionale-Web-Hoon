import { connectToDB } from "@/utils/database";
import SnapshotCollaborazioni from "@/models/SnapshotCollaborazioni";

export async function POST(req) {
  try {
    await connectToDB();
    
    // Elimina tutti gli snapshot esistenti
    const result = await SnapshotCollaborazioni.deleteMany({});
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Eliminati ${result.deletedCount} snapshot`,
        deletedCount: result.deletedCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Errore nell'eliminazione degli snapshot:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return new Response(
    JSON.stringify({
      message: "Usa POST per eliminare tutti gli snapshot esistenti",
      warning: "⚠️ Questa operazione è irreversibile!"
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
