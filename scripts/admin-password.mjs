// admin 계정 생성/비밀번호 재설정 — 자립 운영용.
//
// 사용:
//   node scripts/admin-password.mjs <email> <password> [name]
//
// 동작:
//   - 해당 email 의 admin 이 있으면 비밀번호 재설정 (+ active=true)
//   - 없으면 새 admin 생성 (role=admin, active=true)
//
// 잠겨서 로그인 못 할 때 이 스크립트로 자가 복구 (이메일·UI·외부 의존 X).
// .env.local 의 NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 사용.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env.local");

function readEnv(key) {
  const txt = readFileSync(envPath, "utf8");
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (t.slice(0, eq).trim() === key) return t.slice(eq + 1).trim();
  }
  return undefined;
}

const [, , email, password, nameArg] = process.argv;
if (!email || !password) {
  console.error(
    "사용법: node scripts/admin-password.mjs <email> <password> [name]",
  );
  process.exit(1);
}

const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) {
  console.error(".env.local 에서 Supabase URL/SERVICE_ROLE_KEY 를 못 읽었습니다.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const passwordHash = bcrypt.hashSync(password, 10);

const { data: existing } = await supabase
  .from("admins")
  .select("id")
  .eq("email", email)
  .maybeSingle();

if (existing) {
  const { error } = await supabase
    .from("admins")
    .update({ password_hash: passwordHash, active: true })
    .eq("id", existing.id);
  if (error) {
    console.error("재설정 실패:", error.message);
    process.exit(1);
  }
  console.log(`✓ 비밀번호 재설정 완료: ${email}`);
} else {
  const { error } = await supabase.from("admins").insert({
    email,
    name: nameArg ?? email.split("@")[0],
    role: "admin",
    password_hash: passwordHash,
    active: true,
  });
  if (error) {
    console.error("생성 실패:", error.message);
    process.exit(1);
  }
  console.log(`✓ admin 계정 생성 완료: ${email}`);
}
console.log("  로그인: /admin/login → 이 email + 설정한 password");
console.log("  ⚠ 로그인 후 [설정] 에서 비밀번호를 꼭 변경하세요.");
