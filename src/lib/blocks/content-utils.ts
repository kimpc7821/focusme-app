/**
 * 블록 content JSON 평탄화·patch 유틸.
 *
 * 두 곳에서 공유:
 *   - 발행 후 자료 수정 (`/me/pages/[id]/edit/EditForm.tsx`)
 *   - v2 Step 2 자료 입력 (`/me/pages/[id]/submit/Step2Materials.tsx`)
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §3.3
 */

export interface ContentField {
  path: (string | number)[];
  pathLabel: string; // path.join('.') — drafts map key
  value: string;
  originalType: "string" | "number";
  multiline: boolean;
}

/**
 * content JSON 의 string·number leaf 만 path 와 함께 평탄화.
 * 배열은 인덱스로 path 에 포함 (예: ["slides", 0, "image_url"]).
 * 빈 string 도 노출 (사장님이 입력하고 싶을 수 있어서).
 */
export function flattenLeafFields(
  obj: unknown,
  basePath: (string | number)[] = [],
): ContentField[] {
  const out: ContentField[] = [];
  if (obj === null || obj === undefined) return out;

  if (typeof obj === "string" || typeof obj === "number") {
    const value = String(obj);
    out.push({
      path: basePath,
      pathLabel: basePath.join("."),
      value,
      originalType: typeof obj as "string" | "number",
      multiline: value.length > 60 || value.includes("\n"),
    });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      out.push(...flattenLeafFields(item, [...basePath, i]));
    });
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out.push(...flattenLeafFields(v, [...basePath, k]));
    }
    return out;
  }
  return out;
}

/**
 * path 기반 nested object patch.
 * 예: [["slides", 0, "caption"], "새 캡션"] → { slides: [{ caption: "새 캡션" }] }
 */
export function setByPath(
  target: Record<string, unknown>,
  path: (string | number)[],
  value: unknown,
): void {
  let cur: Record<string, unknown> | unknown[] = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    const wantArray = typeof nextKey === "number";
    const ck = key as keyof typeof cur;
    let existing = (cur as Record<string | number, unknown>)[ck as never];
    if (existing === undefined || existing === null) {
      existing = wantArray ? [] : {};
      (cur as Record<string | number, unknown>)[ck as never] = existing as never;
    }
    cur = existing as Record<string, unknown> | unknown[];
  }
  (cur as Record<string | number, unknown>)[path[path.length - 1] as never] =
    value as never;
}

/**
 * dirty 필드의 path/value 로 기존 content 를 deep clone 후 patch 한 결과 반환.
 * 일괄 저장 (Step 2 "저장하기" 또는 /edit "저장하기") 시 PATCH body 생성에 사용.
 */
export function buildContentPatch(
  originalContent: Record<string, unknown>,
  dirtyFields: ContentField[],
): Record<string, unknown> {
  const merged = structuredClone(originalContent) as Record<string, unknown>;
  for (const f of dirtyFields) {
    const cast =
      f.originalType === "number" &&
      f.value.trim() !== "" &&
      !isNaN(Number(f.value))
        ? Number(f.value)
        : f.value;
    setByPath(merged, f.path, cast);
  }
  return merged;
}
