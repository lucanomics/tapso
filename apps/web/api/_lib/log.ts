/**
 * Structured server logging.
 *
 * Personal data never reaches the log verbatim: addresses are masked and
 * provider payloads are reduced to the few fields worth diagnosing.
 */

export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, string | number | boolean | undefined>;

/** `seonjae.k02@gmail.com` becomes `se***02@gmail.com`. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/** Keeps a bucket key greppable without publishing the raw client address. */
export function maskIp(ip: string): string {
  if (ip.includes(":")) return `${ip.split(":").slice(0, 2).join(":")}::/32`;
  const parts = ip.split(".");
  if (parts.length !== 4) return "unknown";
  return `${parts[0]}.${parts[1]}.x.x`;
}

export function log(level: LogLevel, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
