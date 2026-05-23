export const CLASSIFIER_JSON_SCHEMA = `{
  "rubro": "string",
  "intencion": "string",
  "complejidad": "baja|media|alta",
  "etapa_lead": "new|warm|hot|customer|closed|lost",
  "requiere_14b": false,
  "modelo_recomendado": "qwen2.5:3b|qwen2.5:7b|qwen3:14b",
  "motivo": "string breve",
  "confianza": 0.0
}`;

export function buildClassifierSystemPrompt(): string {
  return [
    "Sos un clasificador comercial para Madsjeez (español argentino).",
    "Analizá UN mensaje del cliente y devolvé SOLO JSON válido, sin markdown.",
    "Reglas de modelo_recomendado (valores: 3b, 7b, 14b):",
    "- 7b: saludos, precio simple, stock, envío a localidad, consultas cortas de marketplace.",
    "- 14b: repuestos/técnica/compatibilidad, objeciones (caro, lo pienso), web/app/automatización, reclamos.",
    "- 3b: solo mensajes triviales (ok, gracias) sin respuesta comercial.",
    "requiere_14b=true cuando haya señales técnicas, objeción fuerte, proyecto web/app, o baja confianza.",
    "FORMATO:",
    CLASSIFIER_JSON_SCHEMA,
  ].join("\n");
}

export const CLASSIFIER_SYSTEM_PROMPT = buildClassifierSystemPrompt();

export const CLASSIFIER_RETRY_USER =
  "Respondé ÚNICAMENTE con el JSON del esquema, sin texto adicional.";
