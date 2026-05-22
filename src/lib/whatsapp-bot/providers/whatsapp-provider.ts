export type CreateSessionResult = {
  providerInstanceId: string;
  status: "qr_pending" | "connected" | "disconnected" | "error";
  qrCode?: string | null;
  phoneNumber?: string | null;
  error?: string | null;
};

export type ConnectionStateResult = {
  status: "qr_pending" | "connected" | "disconnected" | "error";
  qrCode?: string | null;
  phoneNumber?: string | null;
  error?: string | null;
};

export type SendMessageResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

export type WebhookHandleResult = {
  handled: boolean;
  instanceName?: string;
  phone?: string;
  text?: string;
  providerMessageId?: string;
  fromMe?: boolean;
};

export interface WhatsAppProvider {
  readonly kind: string;
  createSession(sellerId: string, storeId?: string | null): Promise<CreateSessionResult>;
  getQRCode(providerInstanceId: string): Promise<CreateSessionResult>;
  getConnectionState(providerInstanceId: string): Promise<ConnectionStateResult>;
  sendMessage(providerInstanceId: string, phone: string, message: string): Promise<SendMessageResult>;
  disconnect(providerInstanceId: string): Promise<void>;
  parseWebhook(payload: unknown): WebhookHandleResult | null;
}
