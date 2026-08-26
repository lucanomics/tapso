/**
 * Support payment domain.
 *
 * TERMINOLOGY: the button says `후원하기`, but nothing here calls the payment a
 * donation. TAPSO has not established charitable, non-profit, or
 * tax-deductible status, so the code uses the neutral word "support" and makes
 * no claim about how the money is treated for accounting or tax purposes.
 */

export type SupportAmountPolicy = {
  currency: "KRW";
  presetAmounts: number[];
  minAmount: number;
  maxAmount: number;
};

/**
 * Statuses that the chosen provider can actually produce. Toss captures at
 * confirm time, so there is no card-authorization state; `awaiting_deposit` is
 * the virtual-account case where a bank account was issued but no money has
 * arrived.
 */
export type SupportPaymentStatus =
  | "pending"
  | "awaiting_deposit"
  | "paid"
  | "cancelled"
  | "failed"
  | "refunded";

export type SupportPaymentRecord = {
  orderId: string;
  provider: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: SupportPaymentStatus;
  confirmedAt?: string;
};

/** What the provider says a payment is, after the server asked it directly. */
export type ProviderPaymentView = {
  providerPaymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: SupportPaymentStatus;
  failureCode?: string;
  approvedAt?: string;
};

export type ProviderResult =
  | { ok: true; payment: ProviderPaymentView }
  | { ok: false; code: string; message: string };

export type SupportPaymentProvider = {
  readonly name: string;
  /**
   * Captures a payment the browser completed. The amount is passed so the
   * provider can reject a mismatch on its side too.
   */
  confirm(input: { paymentKey: string; orderId: string; amount: number }): Promise<ProviderResult>;
  /** Authoritative read. Used to reconcile webhooks, which carry no proof. */
  fetch(paymentKey: string): Promise<ProviderResult>;
};

const ALLOWED_TRANSITIONS: Record<SupportPaymentStatus, readonly SupportPaymentStatus[]> = {
  pending: ["pending", "awaiting_deposit", "paid", "cancelled", "failed"],
  awaiting_deposit: ["awaiting_deposit", "paid", "cancelled", "failed"],
  // A completed payment can still be cancelled or refunded by the merchant.
  paid: ["paid", "cancelled", "refunded"],
  cancelled: ["cancelled", "refunded"],
  failed: ["failed"],
  refunded: ["refunded"],
};

/**
 * Webhooks can arrive out of order and can be replayed. Blocking a backwards
 * transition means a late `pending` notification cannot un-pay a paid record.
 */
export function canTransition(from: SupportPaymentStatus, to: SupportPaymentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Order ids are the idempotency anchor for the whole lifecycle, so they must be
 * unguessable as well as unique. Toss requires 6-64 characters from
 * `[A-Za-z0-9_-]`.
 */
export function createOrderId(randomBytes: (size: number) => Uint8Array): string {
  const bytes = randomBytes(16);
  let token = "";
  for (const byte of bytes) token += byte.toString(16).padStart(2, "0");
  return `tapso_support_${token}`;
}
