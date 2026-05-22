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
  count?: number;
};

type EvolutionStateResponse = {
  instance?: { instanceName?: string; state?: string };
  state?: string;
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
  if (data.base64) return data.base64.startsWith("data:") ? data.base64 : `data:image/png;base64,${data.base64}`;
  if (data.code) return data.code;
  return null;
}

export class EvolutionWhatsAppProvider implements WhatsAppProvider {
  readonly kind = "evolution";

  async createSession(sellerId: string): Promise<CreateSessionResult> {
    const instanceName = buildInstanceName(sellerId);
    const { appBase, webhookSecret } = getWhatsappBotEnv();
    const webhookUrl = `${appBase}/api/webhooks/evolution`;

    try {
      await evolutionJson("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: {
            url: webhookUrl,
            enabled: true,
            webhookByEvents: false,
            events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
            headers: webhookSecret ? { "x-madsjeez-webhook-secret": webhookSecret } : undefined,
          },
        }),
      });
      logEvolutionSafe("instance_created", { instanceName });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "create_failed";
      if (!msg.includes("already") && !msg.toLowerCase().includes("exist")) {
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
      const msg = e instanceof Error ? e.message : "connect_failed";
      return { providerInstanceId, status: "error", error: msg };
    }
  }

  async getConnectionState(providerInstanceId: string): Promise<ConnectionStateResult> {
    try {
      const data = await evolutionJson<EvolutionStateResponse>(
        `/instance/connectionState/${encodeURIComponent(providerInstanceId)}`,
        { method: "GET" }
      );
      const rawState = data.instance?.state ?? data.state;
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
        error: e instanceof Error ? e.message : "state_failed",
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
      return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
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
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  parseWebhook(payload: unknown): WebhookHandleResult | null {
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    const event = String(p.event ?? p.type ?? "").toUpperCase();

    if (event.includes("CONNECTION")) {
      return { handled: true, instanceName: String(p.instance ?? p.instanceName ?? "") };
    }

    const data = (p.data ?? p) as Record<string, unknown>;
    const key = (data.key ?? {}) as Record<string, unknown>;
    const fromMe = Boolean(key.fromMe ?? data.fromMe);
    if (fromMe) return { handled: false };

    const instanceName = String(p.instance ?? data.instance ?? "");
    const remoteJid = String(key.remoteJid ?? data.remoteJid ?? "");
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
    };
  }
}

let defaultProvider: EvolutionWhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!defaultProvider) defaultProvider = new EvolutionWhatsAppProvider();
  return defaultProvider;
}
