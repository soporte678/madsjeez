import { buildInstanceName, getWhatsappBotEnv } from "../config";
import { evolutionJson, logEvolutionSafe } from "./evolution-client";
import type {
  ConnectionStateResult,
  CreateSessionResult,
  SendMessageResult,
  WebhookHandleResult,
  WhatsAppProvider,
} from "./whatsapp-provider";

type EvolutionConnectResponse = {
  base64?: string;
  code?: string;
  pairingCode?: string;
  qrcode?: { base64?: string };
  count?: number;
};

type EvolutionStateResponse = {
  instance?: { instanceName?: string; state?: string; status?: string };
  state?: string;
  status?: string;
};

type FetchInstanceRow = {
  name?: string;
  instanceName?: string;
  instance?: { instanceName?: string; instance?: string };
};

function mapConnectionState(raw?: string): ConnectionStateResult["status"] {
  const s = (raw || "").toLowerCase();
  if (s === "open" || s === "connected") return "connected";
  if (s === "connecting" || s === "qrcode" || s === "qr") return "qr_pending";
  if (s === "close" || s === "closed" || s === "disconnected") return "disconnected";
  if (s.includes("error")) return "error";
  return "disconnected";
}

function extractQr(data: EvolutionConnectResponse | null): string | null {
  if (!data) return null;
  const b64 = data.base64 ?? data.qrcode?.base64;
  if (b64) return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
  if (data.code) return data.code;
  return null;
}

function evolutionErrorHint(e: unknown): string {
  const err = e as Error & { status?: number; url?: string };
  if (err.status === 404) {
    return "Evolution API no encontrada (404). EVOLUTION_API_URL debe ser el host de Evolution, no Madsjeez. Ver docs/whatsapp-seller-bot.md";
  }
  if (err.status === 401 || err.status === 403) {
    return "API key de Evolution incorrecta (EVOLUTION_API_KEY).";
  }
  return err.message || "evolution_failed";
}

async function listInstanceNames(): Promise<string[]> {
  try {
    const raw = await evolutionJson<FetchInstanceRow[] | { instances?: FetchInstanceRow[] }>(
      "/instance/fetchInstances",
      { method: "GET" }
    );
    const rows = Array.isArray(raw) ? raw : (raw.instances ?? []);
    return rows
      .map(
        (r) =>
          r.instanceName ??
          r.name ??
          r.instance?.instanceName ??
          r.instance?.instance ??
          ""
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Re-aplica webhook en instancias ya creadas (create solo lo setea al crear). */
async function ensureInstanceWebhook(
  instanceName: string,
  webhookUrl: string,
  webhookSecret: string
): Promise<void> {
  await evolutionJson(`/webhook/set/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    body: JSON.stringify({
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      webhookBase64: false,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      headers: webhookSecret
        ? { "x-madsjeez-webhook-secret": webhookSecret }
        : undefined,
    }),
  });
  logEvolutionSafe("webhook_set", { instanceName });
}

async function ensureInstanceCreated(
  instanceName: string,
  webhookUrl: string,
  webhookSecret: string
): Promise<void> {
  const existing = await listInstanceNames();
  if (existing.some((n) => n === instanceName)) {
    logEvolutionSafe("instance_already_exists", { instanceName });
    await ensureInstanceWebhook(instanceName, webhookUrl, webhookSecret);
    return;
  }

  await evolutionJson("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: {
        url: webhookUrl,
        byEvents: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        headers: webhookSecret
          ? { "x-madsjeez-webhook-secret": webhookSecret }
          : undefined,
      },
    }),
  });
  logEvolutionSafe("instance_created", { instanceName });
}

export class EvolutionWhatsAppProvider implements WhatsAppProvider {
  readonly kind = "evolution";

  async createSession(sellerId: string): Promise<CreateSessionResult> {
    const instanceName = buildInstanceName(sellerId);
    const { appBase, webhookSecret } = getWhatsappBotEnv();
    const webhookUrl = `${appBase}/api/webhooks/evolution`;

    try {
      await ensureInstanceCreated(instanceName, webhookUrl, webhookSecret);
    } catch (e) {
      const msg = evolutionErrorHint(e);
      const raw = e instanceof Error ? e.message : "create_failed";
      if (!raw.toLowerCase().includes("already") && !raw.toLowerCase().includes("exist")) {
        logEvolutionSafe("instance_create_error", { instanceName, error: msg });
        return {
          providerInstanceId: instanceName,
          status: "error",
          error: msg,
        };
      }
    }

    return this.getQRCode(instanceName);
  }

  async getQRCode(providerInstanceId: string): Promise<CreateSessionResult> {
    try {
      const connect = await evolutionJson<EvolutionConnectResponse>(
        `/instance/connect/${encodeURIComponent(providerInstanceId)}`,
        { method: "GET" }
      );
      const state = await this.getConnectionState(providerInstanceId);
      return {
        providerInstanceId,
        status: state.status,
        qrCode: state.status === "connected" ? null : extractQr(connect) ?? state.qrCode,
        phoneNumber: state.phoneNumber,
        error: state.error,
      };
    } catch (e) {
      return {
        providerInstanceId,
        status: "error",
        error: evolutionErrorHint(e),
      };
    }
  }

  async getConnectionState(providerInstanceId: string): Promise<ConnectionStateResult> {
    try {
      const data = await evolutionJson<EvolutionStateResponse>(
        `/instance/connectionState/${encodeURIComponent(providerInstanceId)}`,
        { method: "GET" }
      );
      const rawState =
        data.instance?.state ?? data.instance?.status ?? data.state ?? data.status;
      const status = mapConnectionState(rawState);
      if (status === "connected") {
        return { status: "connected", qrCode: null };
      }
      if (status === "qr_pending") {
        try {
          const connect = await evolutionJson<EvolutionConnectResponse>(
            `/instance/connect/${encodeURIComponent(providerInstanceId)}`,
            { method: "GET" }
          );
          return { status: "qr_pending", qrCode: extractQr(connect) };
        } catch {
          return { status: "qr_pending", qrCode: null };
        }
      }
      return { status, error: null };
    } catch (e) {
      return {
        status: "error",
        error: evolutionErrorHint(e),
      };
    }
  }

  async sendMessage(
    providerInstanceId: string,
    phone: string,
    message: string
  ): Promise<SendMessageResult> {
    const digits = phone.replace(/\D/g, "");
    try {
      const data = await evolutionJson<{ key?: { id?: string }; messageId?: string }>(
        `/message/sendText/${encodeURIComponent(providerInstanceId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            number: digits,
            text: message,
          }),
        }
      );
      return {
        ok: true,
        providerMessageId: data.key?.id ?? data.messageId,
      };
    } catch (e) {
      return { ok: false, error: evolutionErrorHint(e) };
    }
  }

  async disconnect(providerInstanceId: string): Promise<void> {
    try {
      await evolutionJson(`/instance/logout/${encodeURIComponent(providerInstanceId)}`, {
        method: "DELETE",
      });
    } catch (e) {
      logEvolutionSafe("logout_error", {
        instance: providerInstanceId,
        error: evolutionErrorHint(e),
      });
    }
  }

  parseWebhook(payload: unknown): WebhookHandleResult | null {
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    const event = String(p.event ?? p.type ?? "").toUpperCase();

    const resolveInstanceName = (raw: unknown): string => {
      if (!raw) return "";
      if (typeof raw === "string") return raw;
      if (typeof raw === "object" && raw !== null) {
        const o = raw as Record<string, unknown>;
        const name =
          o.instanceName ?? o.instance ?? o.name ?? o.instanceId;
        if (typeof name === "string") return name;
      }
      return "";
    };

    if (event.includes("CONNECTION")) {
      return {
        handled: true,
        instanceName: resolveInstanceName(p.instance) || resolveInstanceName(p.instanceName),
      };
    }

    const data = (p.data ?? p) as Record<string, unknown>;
    const key = (data.key ?? {}) as Record<string, unknown>;
    const fromMe = Boolean(key.fromMe ?? data.fromMe);
    if (fromMe) return { handled: false };

    const instanceName =
      resolveInstanceName(p.instance) ||
      resolveInstanceName(p.instanceName) ||
      resolveInstanceName(data.instance);
    const remoteJid = String(key.remoteJid ?? data.remoteJid ?? "");
    if (remoteJid.endsWith("@g.us")) {
      return { handled: false, instanceName, isGroup: true };
    }
    const phone = remoteJid.split("@")[0]?.replace(/\D/g, "") || "";
    const message = (data.message ?? {}) as Record<string, unknown>;
    const text =
      (message.conversation as string) ||
      ((message.extendedTextMessage as Record<string, unknown>)?.text as string) ||
      (data.text as string) ||
      "";

    if (!phone || !text.trim()) return null;

    return {
      handled: true,
      instanceName,
      phone,
      text: text.trim(),
      providerMessageId: String(key.id ?? ""),
      fromMe: false,
      remoteJid,
    };
  }
}

let defaultProvider: EvolutionWhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!defaultProvider) defaultProvider = new EvolutionWhatsAppProvider();
  return defaultProvider;
}
