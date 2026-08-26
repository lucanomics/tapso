/**
 * Toss Payments browser glue.
 *
 * Loaded dynamically and only after the server has reported `mode: "live"`, so
 * the SDK never touches the marketing page's initial render or bundle.
 *
 * REALITY LABEL `UNVERIFIED`: this file cannot be exercised without a merchant
 * client key. It is written against the documented Toss v2 standard SDK and is
 * unreachable while `SUPPORT_ENABLED` is unset.
 */

const SDK_URL = "https://js.tosspayments.com/v2/standard";

type TossPaymentMethods = {
  requestPayment(options: Record<string, unknown>): Promise<void>;
};

type TossPaymentsSdk = (clientKey: string) => {
  payment(options: { customerKey: string }): TossPaymentMethods;
};

declare global {
  interface Window {
    TossPayments?: TossPaymentsSdk;
  }
}

let sdkPromise: Promise<TossPaymentsSdk> | undefined;

function loadSdk(): Promise<TossPaymentsSdk> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<TossPaymentsSdk>((resolve, reject) => {
    if (window.TossPayments) {
      resolve(window.TossPayments);
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.TossPayments) resolve(window.TossPayments);
      else reject(new Error("payment_sdk_missing"));
    };
    script.onerror = () => {
      sdkPromise = undefined;
      reject(new Error("payment_sdk_unreachable"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export type CheckoutInput = {
  clientKey: string;
  orderId: string;
  amount: number;
  currency: "KRW";
};

/**
 * Opens the provider's payment window. It resolves by navigating away, so a
 * normal return from this function means the window closed without paying.
 */
export async function startSupportCheckout(input: CheckoutInput): Promise<void> {
  const TossPayments = await loadSdk();
  const origin = window.location.origin;
  const payment = TossPayments(input.clientKey).payment({
    // Anonymous: TAPSO has no account system and stores no supporter identity.
    customerKey: "ANONYMOUS",
  });

  await payment.requestPayment({
    method: "CARD",
    amount: { currency: input.currency, value: input.amount },
    orderId: input.orderId,
    orderName: "TAPSO 후원",
    successUrl: `${origin}/?support=success`,
    failUrl: `${origin}/?support=fail`,
    card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false },
  });
}
