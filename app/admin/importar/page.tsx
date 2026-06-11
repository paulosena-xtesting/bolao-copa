"use client";

import { supabase } from "@/src/lib/supabase";
import { worldCupMatches } from "@/src/data/worldcup2026";

export default function ImportarJogosPage() {
  async function importarJogos() {
    const { error } = await supabase
      .from("matches")
      .upsert(worldCupMatches, {
        onConflict: "match_number",
      });

    if (error) {
      console.log(error);
      alert("Erro ao importar jogos.");
      return;
    }

    alert("Jogos importados/atualizados com sucesso!");
  }

  async function apagarJogos() {
    const confirmar = confirm("Tem certeza que deseja apagar todos os jogos?");

    if (!confirmar) return;

    const { error } = await supabase.from("matches").delete().neq("id", "");

    if (error) {
      console.log(error);
      alert("Erro ao apagar jogos.");
      return;
    }

    alert("Jogos apagados.");
  }

  return (
    <main style={{ padding: 30 }}>
      <h1>Importar Jogos da Copa</h1>

      <p>Total no arquivo: {worldCupMatches.length}</p>

      <button onClick={importarJogos} style={{ padding: 10, marginRight: 10 }}>
        Importar/Atualizar jogos
      </button>

      <button onClick={apagarJogos} style={{ padding: 10 }}>
        Apagar jogos
      </button>
    </main>
  );
}