import { useState } from "react";
import { useLocation } from "wouter";

const WHATSAPP_NUMBER = "19046798266";
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || "xojgvzla";

function scrollToForm() {
  document.getElementById("formulario-demo")?.scrollIntoView({ behavior: "smooth" });
}

const COLORES = [
  { nombre: "Verde Neon", valor: "#39FF14" },
  { nombre: "Cyan Electrico", valor: "#00CFFF" },
  { nombre: "Violeta", valor: "#BF5FFF" },
  { nombre: "Naranja", valor: "#FF6B2B" },
  { nombre: "Rosa", valor: "#FF2D78" },
];

const MODULOS = [
  { id: "rutinas", label: "Rutinas" },
  { id: "checkins", label: "Check-ins" },
  { id: "recompensas", label: "Recompensas" },
  { id: "pagos", label: "Pagos" },
  { id: "mensajes", label: "Mensajes" },
];

function WhiteLabelPreview() {
  const [marca, setMarca] = useState("Tu Marca");
  const [color, setColor] = useState("#39FF14");
  const marcaDisplay = marca.trim() || "Tu Marca";
  const [activos, setActivos] = useState<Record<string, boolean>>({
    rutinas: true, checkins: true, recompensas: true, pagos: false, mensajes: false,
  });

  function toggleModulo(id: string) {
    setActivos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border"
            style={{ color: "#39FF14", borderColor: "#39FF14", backgroundColor: "rgba(57,255,20,0.08)" }}
          >
            Personaliza en vivo
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Hacela 100% tuya
          </h2>
          <p className="text-gray-400 text-sm max-w-md">
            Cambia el nombre, el color y los modulos. Ves exactamente como queda tu app antes de comprarla.
          </p>
        </div>

        <div className="w-full grid sm:grid-cols-2 gap-6 items-start">
          {/* controles */}
          <div className="rounded-2xl border border-gray-900 p-7 flex flex-col gap-7" style={{ backgroundColor: "#0d0d0d" }}>
            {/* nombre */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                Nombre de tu marca
              </label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                maxLength={24}
                data-testid="input-marca-nombre"
                placeholder="Tu Marca"
                className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-transparent border border-gray-800 text-white placeholder-gray-600 outline-none focus:border-gray-600 transition-colors"
                style={{ backgroundColor: "#070707" }}
              />
            </div>

            {/* colores */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                Color principal
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORES.map((c) => (
                  <button
                    key={c.valor}
                    data-testid={`button-color-${c.nombre.replace(/\s/g, "-").toLowerCase()}`}
                    onClick={() => setColor(c.valor)}
                    title={c.nombre}
                    className="w-9 h-9 rounded-lg transition-transform hover:scale-110 flex-shrink-0"
                    style={{
                      backgroundColor: c.valor,
                      outline: color === c.valor ? `2px solid white` : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
                <label
                  className="w-9 h-9 rounded-lg border border-gray-700 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors text-gray-400 text-xs font-bold overflow-hidden"
                  title="Color personalizado"
                  style={{ backgroundColor: "#070707" }}
                >
                  +
                  <input
                    type="color"
                    className="opacity-0 absolute w-0 h-0"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </label>
              </div>
            </div>

            {/* modulos */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                Modulos activos
              </label>
              <div className="flex flex-col gap-2">
                {MODULOS.map((m) => (
                  <button
                    key={m.id}
                    data-testid={`toggle-modulo-${m.id}`}
                    onClick={() => toggleModulo(m.id)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 text-sm font-bold text-left"
                    style={{
                      borderColor: activos[m.id] ? color : "#1f1f1f",
                      backgroundColor: activos[m.id] ? `${color}12` : "#070707",
                      color: activos[m.id] ? color : "#4b5563",
                    }}
                  >
                    <span>{m.label}</span>
                    <span className="text-xs font-black uppercase tracking-widest opacity-70">
                      {activos[m.id] ? "ON" : "OFF"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* preview */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "#000", borderColor: "#1a1a1a" }}
          >
            {/* barra top */}
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ backgroundColor: color, color: "#000" }}
              >
                {marcaDisplay.charAt(0).toUpperCase()}
              </div>
              <span className="font-black text-sm truncate" style={{ color }}>
                {marcaDisplay}
              </span>
              <span
                className="ml-auto text-xs font-bold px-2 py-1 rounded-full"
                style={{ backgroundColor: `${color}18`, color }}
              >
                PRO
              </span>
            </div>

            {/* bienvenida */}
            <div className="px-5 py-5 border-b" style={{ borderColor: "#1a1a1a" }}>
              <p className="text-xs text-gray-500 mb-1">Hola, alumna</p>
              <p className="font-black text-base">Panel Principal</p>
              <div
                className="mt-3 h-1.5 rounded-full w-3/4"
                style={{ backgroundColor: `${color}30` }}
              >
                <div className="h-full rounded-full w-2/3 transition-all duration-300" style={{ backgroundColor: color }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">Progreso semanal</p>
            </div>

            {/* modulos activos */}
            <div className="px-5 py-4 flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Accesos rapidos</p>
              {MODULOS.filter((m) => activos[m.id]).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                  style={{ borderColor: `${color}22`, backgroundColor: `${color}08` }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-bold" style={{ color }}>{m.label}</span>
                </div>
              ))}
              {MODULOS.filter((m) => activos[m.id]).length === 0 && (
                <p className="text-xs text-gray-600 py-2">Activa al menos un modulo</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ nombre, email }),
      });

      if (!res.ok) throw new Error("Error al enviar");

      setEnviado(true);

      const mensaje = encodeURIComponent(
        `Hola! Soy ${nombre} (${email}). Quiero reservar mi Demo de la App Fitness por $500 USD.`
      );
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, "_blank");
      }, 600);
    } catch {
      setError("Hubo un problema. Intentalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#050505" }} className="min-h-screen text-white font-sans antialiased">

      {/* ── HERO ── */}

      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        {/* grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(57,255,20,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(57,255,20,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          {/* badge */}
          <span
            className="inline-block text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border"
            style={{ color: "#39FF14", borderColor: "#39FF14", backgroundColor: "rgba(57,255,20,0.08)" }}
          >
            FASE BETA - SOLO 3 CUPOS ESTA SEMANA
          </span>

          <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight">
            Lanza tu propia{" "}
            <span style={{ color: "#39FF14" }}>app fitness personalizada</span>
            {" "}por solo{" "}
            <span style={{ color: "#39FF14" }}>$500</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 font-medium">
            Precio de lanzamiento{" "}
            <span className="line-through text-gray-600">$1,000 USD</span>
            {" "}— solo por tiempo limitado
          </p>

          <p className="text-gray-400 max-w-xl leading-relaxed">
            Tu logo, tus colores, tu pasarela de pagos. Gamificacion real para que tus alumnos no paren. Sin royalties, sin comisiones, 100% tuya desde el dia uno.
          </p>

          <button
            onClick={scrollToForm}
            data-testid="button-hero-cta"
            className="mt-2 px-10 py-4 font-black uppercase tracking-widest text-sm rounded-xl transition-all duration-200"
            style={{
              backgroundColor: "#39FF14",
              color: "#050505",
              boxShadow: "0 0 30px rgba(57,255,20,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 50px rgba(57,255,20,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(57,255,20,0.35)";
            }}
          >
            Reservar Demo
          </button>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest mb-12" style={{ color: "#39FF14" }}>
            Por que elegirnos
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Marca 100% Tuya",
                sub: "Estatus e Independencia",
                desc: "Tu nombre, tu logo, tus colores. Tus alumnos ven TU marca, no la nuestra. Posicionamiento de experto desde el primer dia.",
              },
              {
                num: "02",
                title: "0% Comisiones de Terceros",
                sub: "Tus Pagos, Tu Control",
                desc: "Conectas Stripe, MercadoPago o lo que uses. Cada peso va directo a tu cuenta. Sin intermediarios, sin porcentajes escondidos.",
              },
              {
                num: "03",
                title: "Retencion Adictiva (RPG)",
                sub: "Gamificacion Real",
                desc: "Puntos, recompensas y niveles para que tus alumnos completen rutinas, vuelvan todos los dias y nunca cancelen.",
              },
            ].map((b) => (
              <div
                key={b.num}
                className="rounded-2xl border border-gray-900 p-8 flex flex-col gap-4 transition-all duration-200"
                style={{ backgroundColor: "#0d0d0d" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(57,255,20,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgb(17,17,17)";
                }}
              >
                <span className="text-4xl font-black" style={{ color: "rgba(57,255,20,0.25)" }}>
                  {b.num}
                </span>
                <div>
                  <p className="font-black text-lg leading-tight">{b.title}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: "#39FF14" }}>{b.sub}</p>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONALIZADOR INTERACTIVO ── */}
      <WhiteLabelPreview />

      {/* ── DEMO EN VIVO ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border"
              style={{ color: "#39FF14", borderColor: "#39FF14", backgroundColor: "rgba(57,255,20,0.08)" }}
            >
              Demo interactiva
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Asi se ve tu app por dentro
            </h2>
          </div>

          <button
            data-testid="button-demo-interactivo"
            onClick={() => setLocation("/demo")}
            className="px-10 py-4 font-black uppercase tracking-widest text-sm rounded-xl border transition-all duration-200"
            style={{
              backgroundColor: "transparent",
              color: "#39FF14",
              borderColor: "#39FF14",
              boxShadow: "0 0 20px rgba(57,255,20,0.15)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(57,255,20,0.08)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 40px rgba(57,255,20,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(57,255,20,0.15)";
            }}
          >
            Explorar Demo Interactivo
          </button>

          <p className="text-sm text-gray-500 text-center">
            Tu version tendra tu logo · tus colores · tu dominio
          </p>
        </div>
      </section>

      {/* ── CASOS DE USO ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest mb-12" style={{ color: "#39FF14" }}>
            Para quien es esto
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                tag: "A",
                title: "Influencers Fitness (10k-100k)",
                items: [
                  "Monetizas tu audiencia sin depender de sponsors",
                  "Tu marca profesional en el bolsillo de tus seguidores",
                  "Escalas sin contratar staff: la app hace el trabajo",
                ],
              },
              {
                tag: "B",
                title: "Coaches Online en Expansion",
                items: [
                  "Pasas de Notion y PDFs a una plataforma premium",
                  "Tus clientes te pagan dentro de la app, sin friccion",
                  "La gamificacion reduce el churn y sube el LTV",
                ],
              },
            ].map((c) => (
              <div
                key={c.tag}
                className="rounded-2xl border border-gray-900 p-8 flex flex-col gap-6"
                style={{ backgroundColor: "#0d0d0d" }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ backgroundColor: "rgba(57,255,20,0.12)", color: "#39FF14" }}
                  >
                    {c.tag}
                  </span>
                  <h3 className="font-black text-lg leading-tight">{c.title}</h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {c.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#39FF14" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULARIO ── */}
      <section id="formulario-demo" className="py-24 px-6">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border"
              style={{ color: "#39FF14", borderColor: "#39FF14", backgroundColor: "rgba(57,255,20,0.08)" }}
            >
              Cupos limitados
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Reserva tu Demo ahora
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Completa el formulario y te contactamos por WhatsApp para coordinar tu demostracion personalizada.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-gray-900 p-8" style={{ backgroundColor: "#0d0d0d" }}>
            {enviado ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: "rgba(57,255,20,0.12)", color: "#39FF14" }}
                >
                  OK
                </div>
                <p className="font-black text-xl" style={{ color: "#39FF14" }}>
                  Datos Recibidos
                </p>
                <p className="text-gray-400 text-sm">
                  Te abrimos WhatsApp para confirmar tu demo. Si no se abrio,{" "}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Soy ${nombre} (${email}). Quiero reservar mi Demo de la App Fitness por $500 USD.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "#39FF14" }}
                  >
                    hace click aqui
                  </a>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    data-testid="input-nombre"
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-transparent border border-gray-800 text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-600"
                    style={{ backgroundColor: "#070707" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    data-testid="input-email"
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-transparent border border-gray-800 text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-600"
                    style={{ backgroundColor: "#070707" }}
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={enviando}
                  data-testid="button-submit-form"
                  className="mt-2 w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl transition-all duration-200 disabled:opacity-60"
                  style={{
                    backgroundColor: "#39FF14",
                    color: "#050505",
                    boxShadow: "0 0 30px rgba(57,255,20,0.3)",
                  }}
                >
                  {enviando ? "Enviando..." : "Reservar Demo"}
                </button>
                <p className="text-center text-xs text-gray-600">
                  Al reservar confirmas el precio de lanzamiento de $500 USD
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-gray-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p className="font-black uppercase tracking-widest notranslate" translate="no" style={{ color: "#39FF14" }}>
            You Better Work B*tch
          </p>
          <p>Copyright 2026 Constanza Botti. Todos los derechos reservados.</p>
          <a
            href={`mailto:constanzabotti@gmail.com`}
            className="hover:text-gray-400 transition-colors"
          >
            constanzabotti@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
