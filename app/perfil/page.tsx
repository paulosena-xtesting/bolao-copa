"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function PerfilPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setEmail(data.user.email || "");

    const { data: participant } = await supabase
      .from("participants")
      .select("*")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (participant) {
      setName(participant.name);
    }
  }

  async function saveProfile() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    if (!name.trim()) {
      alert("Digite seu nome.");
      return;
    }

    const { error } = await supabase.from("participants").upsert(
      {
        user_id: data.user.id,
        name: name.trim(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.log(error);
      alert("Erro ao salvar perfil.");
      return;
    }

    alert("Perfil salvo!");
    window.location.href = "/palpites";
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: 30, maxWidth: 500, margin: "0 auto" }}>
      <h1>Meu Perfil</h1>

      <p>Email: {email}</p>

      <input
        style={{ display: "block", width: "100%", padding: 10, marginBottom: 10 }}
        placeholder="Seu nome no bolão"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={saveProfile} style={{ padding: 10, marginRight: 10 }}>
        Salvar perfil
      </button>

      <button onClick={logout} style={{ padding: 10 }}>
        Sair
      </button>
    </main>
  );
}