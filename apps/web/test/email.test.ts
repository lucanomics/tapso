import test from "node:test";
import assert from "node:assert/strict";
import { buildConfirmationEmail, createResendTransport } from "../api/_lib/email.ts";
import { maskEmail, maskIp } from "../api/_lib/log.ts";

test("the confirmation names the rider type and stays transactional", () => {
  const message = buildConfirmationEmail("rider@example.com", "visitor");

  assert.equal(message.to, "rider@example.com");
  assert.equal(message.subject, "🍊 TAPSO 사전예약이 완료됐어요");
  assert.match(message.text, /제주 여행객/);
  assert.match(message.text, /광고 메일은 보내지 않습니다/);
  assert.match(message.text, /삭제하고 싶으면/);
  assert.match(message.html, /제주 여행객/);
});

test("the html body escapes interpolated values", () => {
  const message = buildConfirmationEmail("rider@example.com", "resident");
  assert.equal(message.html.includes("<script"), false);
  assert.match(message.html, /^<!doctype html>/);
});

test("a 2xx from the provider counts as delivered", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const transport = createResendTransport(
    { apiKey: "test-key", from: "TAPSO <hello@example.com>", replyTo: "reply@example.com" },
    (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  );

  const result = await transport.send(buildConfirmationEmail("rider@example.com", "resident"));

  assert.deepEqual(result, { delivered: true });
  assert.equal(calls[0]?.url, "https://api.resend.com/emails");
  const body = JSON.parse(String(calls[0]?.init.body)) as Record<string, unknown>;
  assert.deepEqual(body.to, ["rider@example.com"]);
  assert.equal(body.reply_to, "reply@example.com");
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers.authorization, "Bearer test-key");
});

test("a provider error is reported without leaking its body", async () => {
  const transport = createResendTransport(
    { apiKey: "test-key", from: "TAPSO <hello@example.com>" },
    (async () =>
      new Response(JSON.stringify({ message: "domain not verified" }), {
        status: 403,
      })) as unknown as typeof fetch,
  );

  const result = await transport.send(buildConfirmationEmail("rider@example.com", "resident"));

  assert.deepEqual(result, { delivered: false, reason: "resend_http_403" });
});

test("a network failure is reported rather than thrown", async () => {
  const transport = createResendTransport(
    { apiKey: "test-key", from: "TAPSO <hello@example.com>" },
    (async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    }) as unknown as typeof fetch,
  );

  const result = await transport.send(buildConfirmationEmail("rider@example.com", "resident"));
  assert.equal(result.delivered, false);
});

test("logged identifiers are masked", () => {
  assert.equal(maskEmail("seonjae.k02@gmail.com"), "se***2@gmail.com");
  assert.equal(maskEmail("ab@x.com"), "a***@x.com");
  assert.equal(maskEmail("broken"), "***");
  assert.equal(maskIp("203.0.113.7"), "203.0.x.x");
  assert.equal(maskIp("2001:db8::1"), "2001:db8::/32");
});
