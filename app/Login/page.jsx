"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "@node_modules/next/link";
const Login = () => {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // Gestione input
  const handleInput = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  // Gestione invio form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!credentials.email || !credentials.password) {
      setError("Inserisci email e password.");
      return;
    }

    try {
      setPending(true);
      const res = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });
      if (res.error) {
        setError("Credenziali errate");
        setPending(false);
        return;
      }
      router.replace("/");
    } catch (err) {
      console.error("Errore durante il login:", err);
      setError("Errore del server. Riprova più tardi.");
      setPending(false);
    }
  };

  return (
    <div className=" flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h3 className="text-2xl font-semibold text-center text-gray-700 mb-6">
          Accedi al tuo account
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-gray-600 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              onChange={handleInput}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-gray-600 font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              onChange={handleInput}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bottone di invio */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={pending}
          >
            {pending ? "Accesso in corso..." : "Accedi"}
          </button>

          {/* Messaggi di errore */}
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </form>

        {/* Link a registrazione */}
  
      </div>
    </div>
  );
};

export default Login;
