import { useEffect, useState } from "react";

export type Lang = "en" | "es";
const KEY = "civicreach-lang";

// Keyed by the English text so untranslated strings fall back gracefully.
const ES: Record<string, string> = {
  "How can we help today?": "¿Cómo podemos ayudarle hoy?",
  "No account needed. Your information goes only to trained navigators and civilian outreach teams — never to police.": "No necesita cuenta. Su información va solo a navegadores capacitados y equipos civiles de alcance — nunca a la policía.",
  "I need help staying housed": "Necesito ayuda para mantener mi vivienda",
  "Car repair, utility shutoff, back rent, a bus ticket to family, or replacing lost ID. Takes about 2 minutes.": "Reparación de auto, corte de servicios, renta atrasada, un boleto de autobús con su familia o reemplazar una identificación perdida. Toma unos 2 minutos.",
  "Start rapid help request": "Comenzar solicitud de ayuda",
  "Request a compassionate wellness check": "Solicitar una visita de bienestar compasiva",
  "Worried about someone outside? Send a civilian outreach team with water, supplies, and care — not a squad car.": "¿Le preocupa alguien en la calle? Envíe un equipo civil con agua, suministros y cuidado — no una patrulla.",
  "Request outreach": "Solicitar alcance",
  "Fast response": "Respuesta rápida",
  "Wellness requests go directly to the city’s live outreach queue.": "Las solicitudes de bienestar van directo a la fila de alcance de la ciudad.",
  "Private to this city": "Privado para esta ciudad",
  "Your details are seen only by this city’s authorized outreach staff.": "Solo el personal autorizado de esta ciudad ve sus datos.",
  "In crisis right now?": "¿Está en crisis ahora?",
  "For immediate danger call": "En peligro inmediato llame al",
  "For crisis support call or text": "Para apoyo en crisis llame o envíe texto al",
  "Check a request": "Consultar una solicitud",
  "Have a tracking code? See where your request stands.": "¿Tiene un código? Vea el estado de su solicitud.",
  "Check request status": "Consultar estado",
  "Tracking code": "Código de seguimiento",
  "Check status": "Consultar",
  "We couldn't find that code. Check the letters and try again.": "No encontramos ese código. Revise las letras e intente de nuevo.",
  "Submitted": "Enviada",
  "Housing help request": "Solicitud de ayuda de vivienda",
  "Wellness check": "Visita de bienestar",
  "Back": "Volver",
  "Request received": "Solicitud recibida",
  "Your tracking code": "Su código de seguimiento",
  "Write this down or take a screenshot.": "Anótelo o tome una captura de pantalla.",
  "Request a wellness check": "Solicitar una visita de bienestar",
  "A trained civilian outreach team — not police — will check on the person with care.": "Un equipo civil capacitado — no la policía — visitará a la persona con cuidado.",
  "Where are you staying right now?": "¿Dónde se está quedando ahora?",
  "What's the biggest thing in the way?": "¿Cuál es el mayor obstáculo?",
  "About how much would solve it?": "¿Aproximadamente cuánto lo resolvería?",
  "How should we reach you safely?": "¿Cómo podemos contactarle de forma segura?",
  "How can we safely reach you?": "¿Cómo podemos contactarle de forma segura?",
  "Next": "Siguiente",
  "Send request": "Enviar solicitud",
  new: "Recibida — en espera de un navegador", claimed: "Un navegador está trabajando en ella", approved: "Ayuda aprobada", paid: "Pago enviado", closed: "Cerrada",
  unassigned: "Recibida — en espera de un equipo", en_route: "Un equipo va en camino", resolved: "Atendida",
};
const EN_STATUS: Record<string, string> = {
  new: "Received — waiting for a navigator", claimed: "A navigator is working on it", approved: "Help approved", paid: "Payment sent", closed: "Closed",
  unassigned: "Received — waiting for a team", en_route: "A team is on the way", resolved: "Checked on",
};

export function translate(lang: Lang, text: string): string {
  if (lang === "es") return ES[text] ?? EN_STATUS[text] ?? text;
  return EN_STATUS[text] ?? text;
}

/** Resident language preference, saved on the device. Spanish only when the city enables it. */
export function useLang(spanishEnabled = true) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const read = () => setLangState(spanishEnabled && localStorage.getItem(KEY) === "es" ? "es" : "en");
    read();
    window.addEventListener("civicreach-lang", read);
    return () => window.removeEventListener("civicreach-lang", read);
  }, [spanishEnabled]);
  const setLang = (l: Lang) => { localStorage.setItem(KEY, l); window.dispatchEvent(new Event("civicreach-lang")); };
  return { lang, setLang, t: (s: string) => translate(lang, s) };
}
