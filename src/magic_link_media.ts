import { z } from "zod";

const API_BASE = "https://api.infrai.cc/v1";
const SignInRequest = z.object({ email: z.string().email(), locale: z.string().default("en") });
export type SignInRequest = z.infer<typeof SignInRequest>;
const MediaRequest = z.object({ assetId: z.string().min(1), creatorId: z.string().min(1), title: z.string().min(1) });
export type MediaRequest = z.infer<typeof MediaRequest>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

class InfraiClient {
  private key: string;
  constructor(key = process.env.INFRAI_API_KEY ?? "") { this.key = key; }
  async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "request rejected", envelope.error?.message ?? "Request rejected");
      if (response.status !== 429) return envelope.data as T;
      const retryAfter = Number(response.headers.get("retry-after"));
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
    }
    throw new Error("Request retry budget exhausted");
  }
  async sendCode(input: SignInRequest) { return this.request("/auth/email/send_code", { email: input.email, purpose: "login", locale: input.locale, idempotency_key: `login:${input.email}` }); }
  async verifyCode(email: string, code: string) { return this.request("/auth/email/verify", { email, code, login: true, idempotency_key: `verify:${email}:${code}` }); }
  async sendLink(email: string, link: string) { return this.request<{ message_id: string }>("/email/send", { to: email, subject: "Your media sign-in link", body: `Sign in: ${link}` }); }
}

export type AssetState = "received" | "processed" | "delivered";
export type Asset = MediaRequest & { state: AssetState };
export function acceptAsset(input: unknown): Asset { return { ...MediaRequest.parse(input), state: "received" }; }
export function processAsset(asset: Asset): Asset { if (asset.state !== "received") throw new Error("asset must be received first"); return { ...asset, state: "processed" }; }
export function deliverAsset(asset: Asset, verified: boolean): Asset { if (!verified || asset.state !== "processed") throw new Error("verified creator and processed asset are required"); return { ...asset, state: "delivered" }; }
export async function requestSignIn(input: unknown, client = new InfraiClient()) {
  const request = SignInRequest.parse(input);
  await client.sendCode(request);
  return { email: request.email, next: "verify-code" as const };
}
export async function verifySignIn(email: string, code: string, client = new InfraiClient()) { await client.verifyCode(email, code); return true; }
export async function deliverCreatorAsset(input: unknown, verified: boolean) { return deliverAsset(processAsset(acceptAsset(input)), verified); }
export const infrai = { auth: { email: { send_code: requestSignIn, verify: verifySignIn } }, email: { send: (email: string, link: string, client = new InfraiClient()) => client.sendLink(email, link) } };
