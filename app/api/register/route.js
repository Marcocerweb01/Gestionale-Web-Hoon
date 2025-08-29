import { Azienda, Collaboratore, Contatto, Amministratore } from "@models/User.js";
import { connectToDB } from "@/utils/database";
import { updateSnapshot } from "@/utils/snapshotManager";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
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
    let exists;
    if (ruolo.nome === "azienda") {
      exists = await Azienda.findOne({ email });
    } else if (ruolo.nome === "collaboratore") {
      exists = await Collaboratore.findOne({ email });
    } else if (ruolo.nome === "contatto") {
      exists = await Contatto.findOne({ email });
    } else if (ruolo.nome === "amministratore") {
      exists = await Amministratore.findOne({ email });
    }

    if (exists) {
      return NextResponse.json(
        { message: "Email già in uso" },
        { status: 400 }
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
        email,
        password: hashedPassword,
        numerotelefonico,
        partitaIva,
        etichetta: ruolo.dettagli.etichetta,
        ragioneSociale: ruolo.dettagli.ragioneSociale,
        indirizzo: ruolo.dettagli.indirizzo,
      });
    } else if (ruolo.nome === "collaboratore") {
      if (!partitaIva || !ruolo.dettagli?.subRole) {
        return NextResponse.json(
          { message: "Dati specifici del collaboratore mancanti" },
          { status: 400 }
        );
      }

      nuovoUtente = await Collaboratore.create({
        nome,
        cognome,
        email,
        password: hashedPassword,
        partitaIva,
        subRole: ruolo.dettagli.subRole,
      });
    } else if (ruolo.nome === "contatto") {
      nuovoUtente = await Contatto.create({
        nome,
        email,
        password: hashedPassword,
        ragioneSociale: ruolo.dettagli?.ragioneSociale,
        indirizzo: ruolo.dettagli?.indirizzo,
        notes: ruolo.dettagli?.notes,
      });
    } else if (ruolo.nome === "amministratore") {
      nuovoUtente = await Amministratore.create({
        nome,
        email,
        password: hashedPassword,
      });
    } else {
      return NextResponse.json(
        { message: "Ruolo non valido", ruolo },
        { status: 400 }
      );
    }

    // Risposta di successo
    
    // 🔄 TRIGGER: Aggiorna snapshot se è stato aggiunto un nuovo collaboratore
    if (ruolo.nome === "collaboratore") {
      try {
        await updateSnapshot();
        console.log(`Snapshot aggiornato dopo aggiunta nuovo ${ruolo.dettagli.subRole}: ${nome} ${cognome}`);
      } catch (snapshotError) {
        console.error("Errore aggiornamento snapshot:", snapshotError);
        // Non interrompiamo l'operazione se lo snapshot fallisce
      }
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
