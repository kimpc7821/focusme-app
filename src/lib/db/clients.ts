import { createServerSupabase } from "@/lib/supabase/server";

export interface ClientRow {
  id: string;
  phone: string | null;
  kakao_id: string | null;
  email: string | null;
  business_name: string | null;
  business_type: string | null;
  status: string;
  payment_status: string;
}

const SELECT =
  "id, phone, kakao_id, email, business_name, business_type, status, payment_status";

export async function findClientByPhone(
  phone: string,
): Promise<ClientRow | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select(SELECT)
    .eq("phone", phone)
    .maybeSingle();
  return (data as ClientRow | null) ?? null;
}

export async function findClientByKakaoId(
  kakaoId: string,
): Promise<ClientRow | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select(SELECT)
    .eq("kakao_id", kakaoId)
    .maybeSingle();
  return (data as ClientRow | null) ?? null;
}

export async function findClientById(id: string): Promise<ClientRow | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as ClientRow | null) ?? null;
}

export async function createClientFromKakao(args: {
  kakaoId: string;
  email?: string;
  phone?: string;
  nickname?: string;
}): Promise<ClientRow> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      kakao_id: args.kakaoId,
      email: args.email ?? null,
      phone: args.phone ?? null,
      business_name: args.nickname ?? null,
    })
    .select(SELECT)
    .single();
  if (error || !data) {
    throw new Error(`클라이언트 생성 실패: ${error?.message ?? "unknown"}`);
  }
  return data as ClientRow;
}

export async function createClientFromPhone(args: {
  phone: string;
}): Promise<ClientRow> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .insert({ phone: args.phone })
    .select(SELECT)
    .single();
  if (error || !data) {
    throw new Error(`클라이언트 생성 실패: ${error?.message ?? "unknown"}`);
  }
  return data as ClientRow;
}

/**
 * 카카오 로그인 시 phone 만 있던 기존 row 에 kakao_id 연결.
 * 반대 방향도 마찬가지 — 추후 SMS 로 인증한 사장님이 카카오 추가 연결할 때.
 */
export async function linkKakaoToClient(
  clientId: string,
  kakaoId: string,
): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("clients")
    .update({ kakao_id: kakaoId })
    .eq("id", clientId);
  if (error) throw new Error(`카카오 연결 실패: ${error.message}`);
}

export async function linkPhoneToClient(
  clientId: string,
  phone: string,
): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("clients")
    .update({ phone })
    .eq("id", clientId);
  if (error) throw new Error(`전화번호 연결 실패: ${error.message}`);
}
