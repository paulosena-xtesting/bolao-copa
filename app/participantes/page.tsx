
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Participant = {
  id: string;
  name: string;
};

export default function ParticipantesPage() {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  async function loadParticipants() {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      alert("Erro ao carregar participantes.");
      return;
    }

    setParticipants(data || []);
  }

  async function addParticipant() {
    if (!name.trim()) {
      alert("Digite um nome.");
      return;
    }

    const { error } = await supabase.from("participants").insert({
      name: name.trim(),
    });

    if (error) {
      console.log(error);
      alert("Erro ao cadastrar participante.");
      return;
    }

    setName("");
    loadParticipants();
  }

  useEffect(() => {
    loadParticipants();
  }, []);

  return (
    <main style={{ padding: 30, maxWidth: 600, margin: "0 auto" }}>
      <h1>Participantes</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          style={{ padding: 10, flex: 1 }}
          placeholder="Nome do participante"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button onClick={addParticipant} style={{ padding: 10 }}>
          Cadastrar
        </button>
      </div>

      <h2>Lista</h2>

      {participants.length === 0 ? (
        <p>Nenhum participante cadastrado.</p>
      ) : (
        <ul>
          {participants.map((participant) => (
            <li key={participant.id}>{participant.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}