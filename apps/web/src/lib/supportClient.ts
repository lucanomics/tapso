import {
  SUPPORT_CONFIRM_ENDPOINT,
  SUPPORT_CONFIG_ENDPOINT,
  SUPPORT_INTENT_ENDPOINT,
  type SupportConfigResponse,
  type SupportConfirmResponse,
  type SupportIntentResponse,
} from "../../api/_lib/contract.ts";

export type { SupportConfigResponse, SupportConfirmResponse, SupportIntentResponse };

const UNAVAILABLE: SupportConfigResponse = {
  mode: "unavailable",
  currency: "KRW",
  presetAmounts: [3000, 5000, 10000],
  minAmount: 1000,
  maxAmount: 100000,
};

/**
 * Whether support can take money is a server fact. A network failure resolves
 * to `unavailable`, so the UI can never invite a payment it cannot start.
 */
export async function fetchSupportConfig(signal?: AbortSignal): Promise<SupportConfigResponse> {
  try {
    const response = await fetch(SUPPORT_CONFIG_ENDPOINT, { signal });
    if (!response.ok) return UNAVAILABLE;
    const body = (await response.json()) as SupportConfigResponse;
    if (body.mode !== "live" || typeof body.clientKey !== "string") {
      return { ...UNAVAILABLE, ...body, mode: "unavailable" };
    }
    return body;
  } catch {
    return UNAVAILABLE;
  }
}

export async function createSupportIntent(amount: number): Promise<SupportIntentResponse> {
  try {
    const response = await fetch(SUPPORT_INTENT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    return (await response.json()) as SupportIntentResponse;
  } catch {
    return { status: "unavailable" };
  }
}

export async function confirmSupportPayment(input: {
  orderId: string;
  paymentKey: string;
  amount: number;
}): Promise<SupportConfirmResponse> {
  try {
    const response = await fetch(SUPPORT_CONFIRM_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await response.json()) as SupportConfirmResponse;
  } catch {
    return { status: "unavailable" };
  }
}

export function formatKrw(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}
