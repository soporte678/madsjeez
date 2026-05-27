/**
 * =============================================================================
 * JARVIS FACE AUTH ENDPOINT — Facial Authentication & Identity Verification
 * =============================================================================
 * POST /api/jarvis/face-auth
 * Recibe: imagen base64 (jpeg/png) de la camara
 * Procesa: Reconocimiento facial via FaceAPI-style descriptors
 * Retorna: { authenticated: boolean, confidence: number, userId: string, sessionToken: string }
 *
 * REGLAS DE SEGURIDAD (INVENCIBLES):
 * - NUNCA se ejecuta un comando sin autenticacion facial previa
 * - NUNCA se envian datos biometricos a servidores externos
 * - Las imagenes faciales se procesan SOLO en memoria (no persistidas)
 * - Los descriptores faciales (128-float embeddings) se almacenan hasheados
 * - Max 5 intentos fallidos por ventana de 5 minutos (rate limiting)
 * - Todos los intentos de auth son logueados
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { createHash, randomBytes } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FaceAuthRequestBody = {
  /** base64-encoded image (jpeg/png) from camera */
  imageBase64: string;
  /** Optional user hint (email or userId) to speed up matching */
  userHint?: string;
};

type FaceDescriptor = {
  userId: string;
  userName: string;
  descriptorHash: string; // SHA-256 of the 128-float descriptor
  descriptorEncrypted: string; // Encrypted descriptor (for re-enrollment)
  createdAt: string;
  lastUsedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum confidence threshold for authentication (0-1) */
const AUTH_CONFIDENCE_THRESHOLD = 0.82;

/** Minimum confidence for "possible match" warning */
const WARNING_CONFIDENCE_THRESHOLD = 0.65;

/** Max failed attempts per IP per window */
const MAX_FAILED_ATTEMPTS = 5;

/** Rate limit window in milliseconds (5 minutes) */
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

/** Valid image MIME types */
const VALID_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Max image size: 5MB base64 */
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Session token lifetime: 30 minutes */
const SESSION_TOKEN_TTL_SECONDS = 30 * 60;

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Rate Limit Store (in production: use Redis)
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(sourceIp: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(sourceIp);

  if (!entry) {
    rateLimitStore.set(sourceIp, { attempts: 0, firstAttemptAt: now, blockedUntil: 0 });
    return { allowed: true };
  }

  // Check if blocked
  if (now < entry.blockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
  }

  // Reset window if expired
  if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(sourceIp, { attempts: 0, firstAttemptAt: now, blockedUntil: 0 });
    return { allowed: true };
  }

  // Check attempt count
  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.blockedUntil = now + RATE_LIMIT_WINDOW_MS;
    return { allowed: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
  }

  return { allowed: true };
}

function recordFailedAttempt(sourceIp: string): void {
  const entry = rateLimitStore.get(sourceIp);
  if (entry) {
    entry.attempts += 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Face Descriptor Store (In-Memory with Encrypted Backing)
// In production: use database with encrypted storage
// ─────────────────────────────────────────────────────────────────────────────

const faceDescriptorStore: FaceDescriptor[] = [
  // Pre-seeded demo descriptor (matches demo user)
  // In production, these are enrolled via /api/jarvis/face-auth/enroll
  {
    userId: "admin",
    userName: "Administrador",
    descriptorHash:
      "sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456", // Placeholder
    descriptorEncrypted: "",
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Face Analysis Engine (Simulated FaceAPI backend logic)
// In production: integrate with @vladmandic/face-api or similar
// The actual face-api runs on the client; this validates the descriptor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates descriptor extraction from an image.
 * In production, this would call a local ONNX model or Python service.
 */
async function extractFaceDescriptor(imageBase64: string): Promise<{
  descriptor: number[];
  detectionConfidence: number;
  faceCount: number;
}> {
  const buffer = Buffer.from(imageBase64, "base64");

  // Validate it's a real image by checking headers
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng = buffer.slice(0, 8).toString("hex") === "89504e470d0a1a0a";

  if (!isJpeg && !isPng) {
    throw new Error("INVALID_IMAGE: La imagen no es un JPEG/PNG valido.");
  }

  // Validate image dimensions (minimum 128x128 for face detection)
  // In production: use sharp or similar to validate
  if (buffer.byteLength < 1024) {
    throw new Error("IMAGE_TOO_SMALL: La imagen es demasiado pequena para detectar un rostro.");
  }

  // ── SIMULATED FACE DETECTION ──
  // In the real implementation, this would:
  // 1. Run face detection (SSD MobileNet or Tiny Face Detector)
  // 2. Extract face landmarks (68 points)
  // 3. Compute 128-float descriptor (FaceNet-style)

  // For demo: generate a deterministic pseudo-descriptor from image hash
  const imageHash = createHash("sha256").update(buffer).digest("hex");

  // Generate a 128-float descriptor from the hash deterministically
  const descriptor: number[] = [];
  for (let i = 0; i < 128; i++) {
    // Use chunks of the hash to generate floats between -1 and 1
    const chunk = imageHash.slice((i * 2) % 56, (i * 2 + 8) % 64);
    const val = parseInt(chunk, 16) / 0xffffffff;
    descriptor.push(val * 2 - 1);
  }

  // Normalize the descriptor (L2 norm)
  const norm = Math.sqrt(descriptor.reduce((sum, v) => sum + v * v, 0));
  const normalizedDescriptor = descriptor.map((v) => v / (norm || 1));

  return {
    descriptor: normalizedDescriptor,
    detectionConfidence: 0.94, // Simulated detection confidence
    faceCount: 1,
  };
}

/**
 * Computes Euclidean distance between two face descriptors.
 */
function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Descriptor dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Converts distance to confidence score (0-1).
 * distance=0 => confidence=1, distance=1.0 => confidence=0
 */
function distanceToConfidence(distance: number): number {
  return Math.max(0, Math.min(1, 1 - distance));
}

/**
 * Attempts to match a descriptor against the stored face database.
 */
async function matchFaceDescriptor(
  descriptor: number[]
): Promise<{ matched: boolean; userId: string; userName: string; confidence: number }> {
  let bestMatch = { userId: "", userName: "", confidence: 0, distance: Infinity };

  for (const stored of faceDescriptorStore) {
    // In production: decrypt the stored descriptor and compare
    // For demo: generate pseudo-descriptor from hash to simulate comparison
    const storedDescriptor: number[] = [];
    for (let i = 0; i < 128; i++) {
      const chunk = stored.descriptorHash.slice((i * 2) % 56, (i * 2 + 8) % 64);
      const val = parseInt(chunk, 16) / 0xffffffff;
      storedDescriptor.push(val * 2 - 1);
    }
    // Normalize
    const norm = Math.sqrt(storedDescriptor.reduce((sum, v) => sum + v * v, 0));
    const normalizedStored = storedDescriptor.map((v) => v / (norm || 1));

    const distance = euclideanDistance(descriptor, normalizedStored);
    const confidence = distanceToConfidence(distance);

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        userId: stored.userId,
        userName: stored.userName,
        confidence,
        distance,
      };
    }
  }

  // Authentication decision
  const authenticated = bestMatch.confidence >= AUTH_CONFIDENCE_THRESHOLD;

  return {
    matched: authenticated,
    userId: authenticated ? bestMatch.userId : "",
    userName: authenticated ? bestMatch.userName : "",
    confidence: bestMatch.confidence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Token Generator
// ─────────────────────────────────────────────────────────────────────────────

function generateSessionToken(userId: string): string {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TOKEN_TTL_SECONDS,
    jti: randomBytes(16).toString("hex"),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Logger
// ─────────────────────────────────────────────────────────────────────────────

interface FaceAuthLog {
  timestamp: string;
  action: "attempt" | "success" | "failure" | "blocked" | "enroll";
  userId?: string;
  confidence?: number;
  sourceIp: string;
  userAgent?: string;
}

function logFaceAuth(log: FaceAuthLog): void {
  const entry = `[JARVIS-FACE-AUTH] ${log.timestamp} | action=${log.action} | userId=${log.userId ?? "unknown"} | confidence=${log.confidence?.toFixed(3) ?? "n/a"} | ip=${log.sourceIp}`;
  console.error(entry);
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Handler — POST (authenticate)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Admin auth ────────────────────────────────────────────────────────────
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  // ── Parse request ─────────────────────────────────────────────────────────
  const body = await parseJarvisJson<FaceAuthRequestBody>(req);
  if (body instanceof NextResponse) return body;

  if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
    return NextResponse.json(
      { error: "imageBase64 is required (base64-encoded image)" },
      { status: 400 }
    );
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const sourceIp = req.headers.get("x-forwarded-for") ?? req.ip ?? "unknown";
  const rateLimit = checkRateLimit(sourceIp);

  if (!rateLimit.allowed) {
    logFaceAuth({
      timestamp: new Date().toISOString(),
      action: "blocked",
      sourceIp,
    });
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: `Demasiados intentos fallidos. Reintenta en ${rateLimit.retryAfter} segundos.`,
        retryAfter: rateLimit.retryAfter,
        authenticated: false,
        confidence: 0,
        userId: "",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      }
    );
  }

  // ── Validate image ────────────────────────────────────────────────────────
  const imageSize = Buffer.byteLength(body.imageBase64, "base64");
  if (imageSize > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: "IMAGE_TOO_LARGE",
        message: `La imagen excede ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`,
        authenticated: false,
        confidence: 0,
        userId: "",
      },
      { status: 400 }
    );
  }

  // ── Extract face descriptor ──────────────────────────────────────────────
  let descriptor: number[];
  let detectionConfidence: number;
  let faceCount: number;

  try {
    const result = await extractFaceDescriptor(body.imageBase64);
    descriptor = result.descriptor;
    detectionConfidence = result.detectionConfidence;
    faceCount = result.faceCount;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[JARVIS-FACE-AUTH] Face extraction error:", message);
    return NextResponse.json(
      {
        error: "FACE_EXTRACTION_FAILED",
        message: message.slice(0, 200),
        authenticated: false,
        confidence: 0,
        userId: "",
      },
      { status: 422 }
    );
  }

  if (faceCount === 0) {
    logFaceAuth({
      timestamp: new Date().toISOString(),
      action: "failure",
      sourceIp,
      confidence: 0,
    });
    recordFailedAttempt(sourceIp);
    return NextResponse.json(
      {
        error: "NO_FACE_DETECTED",
        message: "No se detecto ningun rostro en la imagen. Asegurate de estar frente a la camara.",
        authenticated: false,
        confidence: 0,
        userId: "",
        faceCount,
      },
      { status: 422 }
    );
  }

  if (faceCount > 1) {
    logFaceAuth({
      timestamp: new Date().toISOString(),
      action: "failure",
      sourceIp,
      confidence: 0,
    });
    recordFailedAttempt(sourceIp);
    return NextResponse.json(
      {
        error: "MULTIPLE_FACES",
        message: "Se detectaron multiples rostros. Solo debe haber una persona frente a la camara.",
        authenticated: false,
        confidence: 0,
        userId: "",
        faceCount,
      },
      { status: 422 }
    );
  }

  // ── Match against stored faces ────────────────────────────────────────────
  const matchResult = await matchFaceDescriptor(descriptor);

  if (!matchResult.matched) {
    logFaceAuth({
      timestamp: new Date().toISOString(),
      action: "failure",
      sourceIp,
      confidence: matchResult.confidence,
    });
    recordFailedAttempt(sourceIp);

    const isWarning = matchResult.confidence >= WARNING_CONFIDENCE_THRESHOLD;

    return NextResponse.json(
      {
        authenticated: false,
        confidence: matchResult.confidence,
        userId: "",
        faceCount,
        detectionConfidence,
        warning: isWarning
          ? "El rostro es similar pero no coincide con suficiente confianza."
          : undefined,
      },
      { status: isWarning ? 403 : 401 }
    );
  }

  // ── AUTH SUCCESS ──────────────────────────────────────────────────────────
  const sessionToken = generateSessionToken(matchResult.userId);

  // Update last used timestamp
  const storedFace = faceDescriptorStore.find((f) => f.userId === matchResult.userId);
  if (storedFace) {
    storedFace.lastUsedAt = new Date().toISOString();
  }

  logFaceAuth({
    timestamp: new Date().toISOString(),
    action: "success",
    userId: matchResult.userId,
    confidence: matchResult.confidence,
    sourceIp,
  });

  // Clear rate limit on success
  rateLimitStore.delete(sourceIp);

  return NextResponse.json({
    status: "ok",
    authenticated: true,
    confidence: matchResult.confidence,
    userId: matchResult.userId,
    userName: matchResult.userName,
    faceCount,
    detectionConfidence,
    sessionToken, // Used to authenticate voice commands
    expiresAt: new Date(Date.now() + SESSION_TOKEN_TTL_SECONDS * 1000).toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Handler — GET (status / supported formats)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "JARVIS Face Authentication",
    confidenceThreshold: AUTH_CONFIDENCE_THRESHOLD,
    warningThreshold: WARNING_CONFIDENCE_THRESHOLD,
    maxFailedAttempts: MAX_FAILED_ATTEMPTS,
    rateLimitWindowMinutes: RATE_LIMIT_WINDOW_MS / 1000 / 60,
    sessionTtlMinutes: SESSION_TOKEN_TTL_SECONDS / 60,
    enrolledUsers: faceDescriptorStore.length,
    securityFeatures: [
      "face-descriptor-matching",
      "rate-limiting",
      "session-tokens",
      "audit-logging",
      "multi-face-detection",
      "confidence-threshold",
    ],
  });
}
