import ChiusuraAttivazione from "@/models/ChiusuraAttivazione";
import Collaborazioni from "@/models/Collaborazioni";
import Collaborazioniwebdesign from "@/models/Collaborazioniwebdesign";
import CollaborazioniWebDesignV2 from "@/models/CollaborazioniWebDesignV2";
import GoogleAds from "@/models/GoogleAds";

const closeCollaboration = async (item) => {
  switch (item.collaborazioneTipo) {
    case "social":
      return Collaborazioni.findByIdAndUpdate(item.collaborazioneId, {
        $set: { stato: "terminata", dataFine: item.dataEvento },
      });
    case "webdesign":
      return Collaborazioniwebdesign.findByIdAndUpdate(item.collaborazioneId, {
        $set: { stato: "terminata", dataFineContratto: item.dataEvento },
      });
    case "webdesign-v2":
      return CollaborazioniWebDesignV2.findByIdAndUpdate(item.collaborazioneId, {
        $set: { stato: "terminata", dataFineContratto: item.dataEvento },
      });
    case "googleads":
      return GoogleAds.findByIdAndUpdate(item.collaborazioneId, {
        $set: { campagnaTerminata: true },
      });
    default:
      return null;
  }
};

export const processaEventiScaduti = async (now = new Date()) => {
  const eventi = await ChiusuraAttivazione.find({
    stato: "programmata",
    dataEvento: { $lte: now },
  }).sort({ dataEvento: 1 });

  let processati = 0;
  for (const evento of eventi) {
    try {
      if (evento.categoria === "chiusura") {
        const collaborazione = await closeCollaboration(evento);
        if (!collaborazione) throw new Error("Collaborazione non trovata");
        evento.stato = "completata";
      } else {
        evento.stato = "attiva";
      }
      evento.eseguitaAt = now;
      evento.errore = "";
      await evento.save();
      processati += 1;
    } catch (error) {
      evento.stato = "errore";
      evento.errore = error.message || "Errore durante l'elaborazione";
      await evento.save();
    }
  }

  return { trovati: eventi.length, processati };
};
