"use client";

export default function Navbar() {
  function logout() {
    localStorage.removeItem("bolao_user_id");
    localStorage.removeItem("bolao_user_name");

    window.location.href = "/login";
  }

  return (
    <nav
      style={{
        background: "#111",
        borderBottom: "1px solid #333",
        padding: "18px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          color: "#d4af37",
          fontWeight: 700,
          fontSize: "22px",
        }}
      >
        ⚽ Bolão Copa 2026
      </div>

      <div>
        <a
          href="/palpites"
          style={{ color: "white", marginRight: 20 }}
        >
          Palpites
        </a>

        <a
          href="/historico"
          style={{ color: "white", marginRight: 20 }}
        >
          Histórico
        </a>

        <a
          href="/ranking"
          style={{ color: "white", marginRight: 20 }}
        >
          Ranking
        </a>

        <a
          href="/grupos"
          style={{ color: "white", marginRight: 20 }}
        >
          Grupos
        </a>


        <button onClick={logout}>Sair</button>
      </div>
    </nav>
  );
}