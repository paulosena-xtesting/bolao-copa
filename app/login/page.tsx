"use client";

import { useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function register() {
    if (!username.trim() || !password.trim() || !name.trim()) {
      alert("Preencha todos os campos.");
      return;
    }

    if (password.length < 4) {
      alert("A senha precisa ter pelo menos 4 caracteres.");
      return;
    }

    const { data: existingUser } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", username.trim())
      .maybeSingle();

    if (existingUser) {
      alert("Esse usuário já existe.");
      return;
    }

    const { data: newUser, error } = await supabase
      .from("app_users")
      .insert({
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
      })
      .select()
      .single();

    if (error || !newUser) {
      console.log(error);
      alert("Erro ao criar usuário.");
      return;
    }

    await supabase.from("participants").insert({
      name: name.trim(),
      app_user_id: newUser.id,
    });

    localStorage.setItem("bolao_user_id", newUser.id);
    localStorage.setItem("bolao_user_name", newUser.name);

    window.location.href = "/palpites";
  }

  async function login() {
    if (!username.trim() || !password.trim()) {
      alert("Preencha usuário e senha.");
      return;
    }

    const { data: user, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", username.trim())
      .eq("password", password.trim())
      .maybeSingle();

    if (error || !user) {
      alert("Usuário ou senha inválidos.");
      return;
    }

    localStorage.setItem("bolao_user_id", user.id);
    localStorage.setItem("bolao_user_name", user.name);

    window.location.href = "/palpites";
  }

  return (
    <main style={{ padding: 30, maxWidth: 420, margin: "0 auto" }}>
      <h1>{mode === "login" ? "Entrar no Bolão" : "Criar conta"}</h1>

      {mode === "register" && (
        <input
          style={{ display: "block", width: "100%", padding: 10, marginBottom: 10 }}
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}

      <input
        style={{ display: "block", width: "100%", padding: 10, marginBottom: 10 }}
        placeholder="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        style={{ display: "block", width: "100%", padding: 10, marginBottom: 10 }}
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {mode === "login" ? (
        <>
          <button onClick={login} style={{ padding: 10, marginRight: 10 }}>
            Entrar
          </button>

          <button onClick={() => setMode("register")} style={{ padding: 10 }}>
            Criar conta
          </button>
        </>
      ) : (
        <>
          <button onClick={register} style={{ padding: 10, marginRight: 10 }}>
            Cadastrar
          </button>

          <button onClick={() => setMode("login")} style={{ padding: 10 }}>
            Já tenho conta
          </button>
        </>
      )}
    </main>
  );
}