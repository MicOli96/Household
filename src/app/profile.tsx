import { useState, type ChangeEvent, type FormEvent } from "react";

const AVATARS = [
  { id: "fox", emoji: "🦊", color: "#fed7aa" },
  { id: "bear", emoji: "🐻", color: "#d6b99a" },
  { id: "panda", emoji: "🐼", color: "#e5e7eb" },
  { id: "koala", emoji: "🐨", color: "#cbd5e1" },
  { id: "lion", emoji: "🦁", color: "#fde68a" },
  { id: "frog", emoji: "🐸", color: "#bbf7d0" },
  { id: "monkey", emoji: "🐵", color: "#fecaca" },
  { id: "rabbit", emoji: "🐰", color: "#fbcfe8" },
];

// TODO: get these from the household instead
const TAKEN_AVATARS = ["bear"];

export default function Profile() {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Saving:", { name, avatar });
  };

  return (
    
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        width: "100%",
        maxWidth: 480,
        minHeight: "100vh",
        margin: "0 auto",
        padding: 24,
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <input
        type="text"
        name="name"
        aria-label="Namn"
        value={name}
        onChange={handleChange}
        placeholder="Ditt namn"
        style={{
          width: "100%",
          padding: "16px 20px",
          fontSize: 18,
          textAlign: "center",
          border: "2px solid #ccc",
          borderRadius: 16,
          boxSizing: "border-box",
        }}
      />

      <p
        style={{
          color: "#4b5563",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1,
          margin: 0,
        }}
      >
        VÄLJ AVATAR
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          width: "100%",
        }}
      >
        {AVATARS.map(({ id, emoji, color }) => {
          const selected = avatar === id;
          const taken = TAKEN_AVATARS.includes(id);

          return (
            <button
              key={id}
              type="button"
              aria-label={id}
              aria-pressed={selected}
              disabled={taken}
              onClick={() => setAvatar(selected ? null : id)}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                fontSize: "clamp(24px, 8vw, 40px)",
                cursor: taken ? "not-allowed" : "pointer",
                opacity: taken ? 0.35 : 1,
                background: color,
                border: selected ? "3px solid #2563eb" : "3px solid transparent",
                padding: 0,
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
        Utgråade är upptagna i hushållet
      </p>

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "16px 0",
          fontSize: 18,
          fontWeight: 600,
          color: "#fff",
          background: "#f97316",
          border: "none",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        Spara
      </button>
    </form>
  );
}

  // <Placeholder
    //   title="Profil"
    //   area={2}
    //   issues="#27, #29, #30"
    //   todo={[
    //     "Fält för namn",
    //     "Avatarväljare med de 8 djuren (Avatar)",
    //     "Avatarer som är upptagna i hushållet är utgråade (Avatar disabled)",
    //     "Knapp \"Spara\"",
    //   ]}
    //   links={[
    //     { label: "Spara", href: "/households" },
    //   ]}
    // />
