import CredentialsProvider from "next-auth/providers/credentials";
import { Collaboratore, Amministratore, Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";
import bcrypt from "bcrypt";

async function login(credentials) {
  try {
    await connectToDB();

    // Array di modelli da controllare
    const userModels = [
      { model: Collaboratore, role: "collaboratore" },
      { model: Amministratore, role: "amministratore" },
      { model: Azienda, role: "azienda" },
    ];

    // Verifica l'email in ciascun modello
    for (const { model, role } of userModels) {
      const user = await model.findOne({ email: credentials.email });
      if (user) {
        const isCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isCorrect) throw new Error("Password errata");

        // ✨ CONTROLLO STATUS PER COLLABORATORI
        if (role === "collaboratore" && user.status === "non_attivo") {
          throw new Error("Account disattivato. Contatta l'amministratore.");
        }

        // Restituisci i dati utente con il ruolo specifico
        return { 
          _id: user._id, 
          email: user.email, 
          nome: user.nome, 
          cognome: user.cognome,
          role, 
          subrole: user.subRole,
          status: user.status || "attivo" // Per compatibilità con utenti esistenti
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
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.nome = token.nome;
        session.user.cognome = token.cognome;
        session.user.role = token.role;
        session.user.subrole = token.subrole;
        session.user.status = token.status;
      }
      return session;
    },
  },
};
