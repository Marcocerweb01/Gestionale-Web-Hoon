import CredentialsProvider from "next-auth/providers/credentials";
import { Collaboratore, Amministratore, Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";
import bcrypt from "bcrypt";

const AUTH_REFRESH_INTERVAL_MS = 60 * 1000;

async function refreshTokenUserData(token) {
  if (!token?.id) return token;

  const lastRefresh = Number(token.authRefreshedAt || 0);
  if (Date.now() - lastRefresh < AUTH_REFRESH_INTERVAL_MS) return token;

  try {
    await connectToDB();

    // Cerchiamo per id su tutti i modelli per supportare anche i vecchi JWT,
    // che non contengono ancora il tipo di account.
    let collaboratore;
    let amministratore;
    let azienda;

    if (token.accountType === "collaboratore") {
      collaboratore = await Collaboratore.findById(token.id)
        .select("email nome cognome subRoles isAdmin status")
        .lean();
    } else if (token.accountType === "amministratore") {
      amministratore = await Amministratore.findById(token.id)
        .select("email nome cognome ruolo")
        .lean();
    } else if (token.accountType === "azienda") {
      azienda = await Azienda.findById(token.id)
        .select("email nome cognome status")
        .lean();
    } else {
      [collaboratore, amministratore, azienda] = await Promise.all([
        Collaboratore.findById(token.id)
          .select("email nome cognome subRoles isAdmin status")
          .lean(),
        Amministratore.findById(token.id)
          .select("email nome cognome ruolo")
          .lean(),
        Azienda.findById(token.id)
          .select("email nome cognome status")
          .lean(),
      ]);
    }

    const user = collaboratore || amministratore || azienda;
    if (!user) {
      token.status = "non_attivo";
      token.authRefreshedAt = Date.now();
      return token;
    }

    token.email = user.email;
    token.nome = user.nome;
    token.cognome = user.cognome;

    if (collaboratore) {
      token.accountType = "collaboratore";
      token.role = collaboratore.isAdmin ? "amministratore" : "collaboratore";
      token.subRoles = collaboratore.subRoles || [];
      token.subrole = token.subRoles[0];
      token.status = collaboratore.status || "attivo";
    } else if (amministratore) {
      token.accountType = "amministratore";
      token.role = amministratore.ruolo || "amministratore";
      token.subRoles = [];
      token.subrole = undefined;
      token.status = "attivo";
    } else {
      token.accountType = "azienda";
      token.role = "azienda";
      token.subRoles = [];
      token.subrole = undefined;
      token.status = azienda.status || "attivo";
    }

    token.authRefreshedAt = Date.now();
  } catch (error) {
    // Un problema temporaneo al DB non deve invalidare una sessione valida.
    console.error("Errore aggiornamento dati sessione:", error);
  }

  return token;
}

async function login(credentials) {
  try {
    await connectToDB();

    // Array di modelli da controllare
    const userModels = [
      { model: Collaboratore, role: "collaboratore" },
      { model: Amministratore, role: null }, // ruolo dinamico: "amministratore" o "segretaria"
      { model: Azienda, role: "azienda" },
    ];

    // Verifica l'email in ciascun modello
    for (const { model, role } of userModels) {
      const user = await model.findOne({ email: credentials.email });
      if (user) {
        const isCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isCorrect) throw new Error("Password errata");

        // ✨ CONTROLLO STATUS ACCOUNT
        if (user.status === "non_attivo") {
          throw new Error("Account disattivato. Contatta l'amministratore.");
        }

        // Ruolo dinamico per Amministratore (può essere "amministratore" o "segretaria")
        const userRole = model === Collaboratore && user.isAdmin
          ? "amministratore"
          : role ?? (user.ruolo || "amministratore");

        // Restituisci i dati utente con il ruolo specifico
        return { 
          _id: user._id, 
          email: user.email, 
          nome: user.nome, 
          cognome: user.cognome,
          role: userRole, 
          subrole: user.subRole,
          subRoles: user.subRoles || (user.subRole ? [user.subRole] : []), // Array di ruoli
          status: user.status || "attivo", // Per compatibilità con utenti esistenti
          accountType: model === Collaboratore
            ? "collaboratore"
            : model === Amministratore
              ? "amministratore"
              : "azienda",
        };
      }
    }

    throw new Error("Nome utente errato");
  } catch (error) {
    console.log(error);
    throw new Error("Errore durante l'accesso");
  }
}

export const authOptions = {
  pages: {
    signIn: "/Login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          const user = await login(credentials);
          console.log(user);
          return user;
        } catch (error) {
          throw new Error("Errore durante l'accesso");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id.toString();
        token.email = user.email;
        token.nome = user.nome;
        token.cognome = user.cognome;
        token.role = user.role;
        token.subrole = user.subrole;
        token.subRoles = user.subRoles; // Array di ruoli
        token.status = user.status;
        token.accountType = user.accountType;
        token.authRefreshedAt = Date.now();
        return token;
      }

      return refreshTokenUserData(token);
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.nome = token.nome;
        session.user.cognome = token.cognome;
        session.user.role = token.role;
        session.user.subrole = token.subrole;
        session.user.subRoles = token.subRoles; // Array di ruoli
        session.user.status = token.status;
      }
      return session;
    },
  },
};
