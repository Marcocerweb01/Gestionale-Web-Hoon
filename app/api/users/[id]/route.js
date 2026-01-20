import { connectToDB } from "@/utils/database";
import { Azienda, Collaboratore, Contatto, Amministratore } from "@/models/User";
import Pagamenti from "@/models/Pagamenti";
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
    let userModel = null;

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

    // Se è un'Azienda, recupera lo stato del pagamento dal mese corrente
    if (userModel === Azienda) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const pagamento = await Pagamenti.findOne({
        cliente: userId,
        data_fattura: { $gte: startOfMonth, $lte: endOfMonth }
      }).sort({ createdAt: -1 });

      // Sovrascrivi il campo pagamento con lo stato reale dal DB Pagamenti
      if (pagamento) {
        const userObj = user.toObject();
        // Converti lo stato del pagamento: "si" = true (pagato), "no"/"ragazzi" = false
        userObj.pagamento = pagamento.stato === "si";
        userObj.statoPagamentoReale = pagamento.stato; // Aggiungi anche lo stato originale
        
        return new Response(JSON.stringify(userObj), { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
      }
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
      const body = await req.json();
      const { nome, cognome, email, password, ...rest } = body;
      
      console.log(`🔄 [PUT] Aggiornamento utente ${userId}. Dati ricevuti:`, body);
  
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
  
      // Aggiungi altri campi specifici al ruolo (incluse noteAmministratore)
      Object.assign(updates, rest);
      
      console.log(`📝 Updates finali da salvare:`, updates);
  
      // Aggiorna l'utente nel database
      const updatedUser = await userModel.findByIdAndUpdate(
        userId, 
        { $set: updates }, // ✨ Usa $set per forzare l'aggiornamento
        {
          new: true,
          strict: false, // ✨ Permette campi non nello schema
        }
      );
      
      console.log(`✅ Utente aggiornato con successo:`, updatedUser);
  
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
      
      console.log(`🔄 [PATCH] Aggiornamento utente ${userId}. Dati ricevuti:`, updates);
      console.log(`📝 noteAmministratore presenti?`, 'noteAmministratore' in updates ? 'SI' : 'NO');
      if ('noteAmministratore' in updates) {
        console.log(`📝 Valore noteAmministratore: "${updates.noteAmministratore}"`);
      }
  
      // Cerca l'utente in tutte le collezioni con read primary
      const models = [Azienda, Collaboratore, Contatto, Amministratore];
      let userModel = null;
  
      for (const model of models) {
        const user = await model.findById(userId).read('primary'); // ✨ FORZA primary read
        if (user) {
          userModel = model;
          console.log(`✅ Utente trovato nel modello: ${model.modelName}`);
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
      const updatedUser = await userModel.findByIdAndUpdate(
        userId, 
        { $set: updates }, // ✨ Usa $set per forzare l'aggiornamento anche di campi non esistenti
        {
          new: true,
          runValidators: false, // ✨ Disabilita validator per permettere campi opzionali
          strict: false, // ✨ Permette di aggiungere campi non nello schema strict
          writeConcern: { w: 'majority' },
        }
      );
      
      console.log(`✅ Utente ${userId} aggiornato con successo.`);
      console.log(`📝 noteAmministratore salvate:`, updatedUser.noteAmministratore || '(vuoto)');
  
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
  