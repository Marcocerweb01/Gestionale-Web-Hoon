import { connectToDB } from "@/utils/database";
import { Azienda, Collaboratore, Contatto, Amministratore } from "@/models/User";
import bcrypt from "bcrypt";

// ✨ FORZA DYNAMIC RENDERING - NO CACHE
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(req, { params }) {
  try {
    await connectToDB();

    const userId = params.id;

    // Cerca l'utente in tutte le collezioni
    const models = [Azienda, Collaboratore, Contatto, Amministratore];
    let user = null;

    for (const model of models) {
      user = await model.findById(userId);
      if (user) break;
    }

    if (!user) {
      return new Response(
        JSON.stringify({ message: "Utente non trovato" }),
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    return new Response(JSON.stringify(user), { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Errore durante il recupero dell'utente:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
    try {
      await connectToDB();
  
      const userId = params.id; // Estrai l'ID dalla route
      const { nome, cognome, email, password, ...rest } = await req.json();
  
      // Cerca l'utente in tutte le collezioni
      const models = [Azienda, Collaboratore, Contatto, Amministratore];
      let userModel = null;
      let user = null;
  
      for (const model of models) {
        user = await model.findById(userId);
        if (user) {
          userModel = model;
          break;
        }
      }
  
      if (!user) {
        return new Response(
          JSON.stringify({ message: "Utente non trovato" }),
          { status: 404 }
        );
      }
  
      // Aggiorna i campi comuni
      const updates = { nome, cognome, email };
  
      // Se c'è una nuova password, hashala
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }
  
      // Aggiungi altri campi specifici al ruolo
      Object.assign(updates, rest);
  
      // Aggiorna l'utente nel database
      const updatedUser = await userModel.findByIdAndUpdate(userId, updates, {
        new: true,
      });
  
      return new Response(JSON.stringify(updatedUser), { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'utente:", error);
      return new Response(
        JSON.stringify({ message: "Errore interno al server" }),
        { status: 500 }
      );
    }
  }
  
  
  export async function PATCH(req, { params }) {
    try {
      await connectToDB();
  
      const userId = params.id; // ID dell'utente dalla route
      const updates = await req.json(); // Dati da aggiornare
      
      console.log(`🔄 [PATCH] Aggiornamento utente ${userId}:`, updates);
  
      // Cerca l'utente in tutte le collezioni con read primary
      const models = [Azienda, Collaboratore, Contatto, Amministratore];
      let userModel = null;
  
      for (const model of models) {
        const user = await model.findById(userId).read('primary'); // ✨ FORZA primary read
        if (user) {
          userModel = model;
          break;
        }
      }
  
      if (!userModel) {
        console.log(`❌ Utente ${userId} non trovato`);
        return new Response(
          JSON.stringify({ message: "Utente non trovato" }),
          { status: 404 }
        );
      }
  
      // ✨ Aggiorna con writeConcern per garantire la scrittura
      const updatedUser = await userModel.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
        writeConcern: { w: 'majority' }, // ✨ Aspetta conferma da majority dei nodi
      });
      
      console.log(`✅ Utente ${userId} aggiornato con successo. Nuovo status:`, updatedUser.status);
  
      return new Response(JSON.stringify(updatedUser), { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'utente:", error);
      return new Response(
        JSON.stringify({ message: "Errore interno al server" }),
        { status: 500 }
      );
    }
  }
  