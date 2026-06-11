"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function Home() {
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    const { data, error } = await supabase
      .from("participants")
      .select("*");

    console.log("Dados:", data);
    console.log("Erro:", error);

    if (data) {
      setParticipants(data);
    }
  }

  return (
    <main style={{ padding: "30px" }}>
      <h1>Bolão da Copa ⚽</h1>

      <h2>Participantes cadastrados:</h2>

      {participants.length === 0 ? (
        <p>Nenhum participante encontrado.</p>
      ) : (
        <ul>
          {participants.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}