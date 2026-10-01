import { Azienda, Collaboratore, Contatto, Amministratore } from "@models/User.js";
import { connectToDB } from "@/utils/database";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["amministratore", "segretaria"].includes(session.user?.role)) {
      return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
    }

    // Connessione al database
    await connectToDB();

    // Parsing dei dati dal corpo della richiesta
    const {
      nome,
      cognome,
      email,
      numerotelefonico,
      password,
      partitaIva,
      ruolo,
    } = await req.json();

    // Validazione dei dati comuni
    if (!email || !password || !ruolo?.nome) {
      return NextResponse.json(
        { message: "Tutti i campi obbligatori" },
        { status: 400 }
      );
    }

    // Verifica se l'utente esiste già
    const normalizedEmail = email.trim().toLowerCase();
    const existingUsers = await Promise.all([
      Azienda.findOne({ email: normalizedEmail }),
      Collaboratore.findOne({ email: normalizedEmail }),
      Contatto.findOne({ email: normalizedEmail }),
      Amministratore.findOne({ email: normalizedEmail }),
    ]);
    const exists = existingUsers.find(Boolean);

    if (exists) {
      return NextResponse.json(
        { message: "Email già in uso" },
        { status: 400 }
      );
    }

    const wantsPrivilegedAccess = ["amministratore", "hoon_lab"].includes(ruolo.nome) || Boolean(ruolo.dettagli?.isAdmin);
    if (wantsPrivilegedAccess && session.user.role !== "amministratore") {
      return NextResponse.json(
        { message: "Solo un amministratore può assegnare privilegi amministratore" },
        { status: 403 }
      );
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creazione dettagli specifici in base al ruolo
    let nuovoUtente;
    if (ruolo.nome === "azienda") {
      if (!partitaIva || !ruolo.dettagli?.ragioneSociale) {
        return NextResponse.json(
          { message: "Dati specifici dell'azienda mancanti" },
          { status: 400 }
        );
      }

      nuovoUtente = await Azienda.create({
        nome,
        cognome,
        email: normalizedEmail,
        password: hashedPassword,
        numerotelefonico,
        partitaIva,
        etichetta: ruolo.dettagli.etichetta,
        ragioneSociale: ruolo.dettagli.ragioneSociale,
        indirizzo: ruolo.dettagli.indirizzo,
      });
    } else if (ruolo.nome === "collaboratore") {
      // Supporta sia subRoles (array) che subRole (singolo) per retrocompatibilità
      const subRoles = ruolo.dettagli?.subRoles || (ruolo.dettagli?.subRole ? [ruolo.dettagli.subRole] : []);
      
      if (!partitaIva || subRoles.length === 0) {
        return NextResponse.json(
          { message: "Dati specifici del collaboratore mancanti o nessuna specializzazione selezionata" },
          { status: 400 }
        );
      }

      nuovoUtente = await Collaboratore.create({
        nome,
        cognome,
        email: normalizedEmail,
        password: hashedPassword,
        partitaIva,
        subRoles: subRoles, // Array di ruoli
        isAdmin: Boolean(ruolo.dettagli?.isAdmin),
      });
    } else if (ruolo.nome === "contatto") {
      nuovoUtente = await Contatto.create({
        nome,
        email: normalizedEmail,
        password: hashedPassword,
        ragioneSociale: ruolo.dettagli?.ragioneSociale,
        indirizzo: ruolo.dettagli?.indirizzo,
        notes: ruolo.dettagli?.notes,
      });
    } else if (["amministratore", "segretaria", "hoon_lab"].includes(ruolo.nome)) {
      nuovoUtente = await Amministratore.create({
        nome,
        cognome,
        email: normalizedEmail,
        password: hashedPassword,
        ruolo: ruolo.nome,
      });
    } else {
      return NextResponse.json(
        { message: "Ruolo non valido", ruolo },
        { status: 400 }
      );
    }

    // Risposta di successo
    
    // 🔄 TRIGGER: Aggiorna snapshot in background se è stato aggiunto un nuovo collaboratore
    if (ruolo.nome === "collaboratore") {
      console.log(`✅ Nuovo ${ruolo.dettagli.subRole} registrato: ${nome} ${cognome}`);
    }
    
    return NextResponse.json(
      { message: "Utente registrato con successo", utente: nuovoUtente },
      { status: 201 }
    );
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    console.log(error)
    return NextResponse.json(
      { message: "Errore del server durante la registrazione" },
      { status: 500 }
    );
  }
}
