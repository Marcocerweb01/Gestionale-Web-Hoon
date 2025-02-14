import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";

export async function PATCH(req) {
    try {
        await connectToDB(); // Connessione al database

        // Aggiorna tutte le collaborazioni che non hanno il campo "pagato"
        const result = await Collaborazione.updateMany(
            { pagato: { $exists: false } }, // Solo se il campo non esiste
            { $set: { pagato: "no" } } // Imposta pagato a "no"
        );

        return new Response(
            JSON.stringify({ message: `Documenti aggiornati: ${result.modifiedCount}` }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Errore aggiornamento collaborazioni:", error);
        return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
    }
}
