import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 환경변수가 없습니다");
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

function bucketName(): string {
  const name = process.env.R2_BUCKET_NAME;
  if (!name) throw new Error("R2_BUCKET_NAME 이 없습니다");
  return name;
}

function publicUrlBase(): string {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error("R2_PUBLIC_URL 이 없습니다");
  return url.replace(/\/$/, "");
}

export async function uploadToR2(args: {
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<{ key: string; publicUrl: string }> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType,
    }),
  );
  return {
    key: args.key,
    publicUrl: `${publicUrlBase()}/${args.key}`,
  };
}

export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucketName(),
      Key: key,
    }),
  );
}

/**
 * publicUrl 에서 key 만 추출. (DELETE 시 사용)
 */
export function keyFromPublicUrl(publicUrl: string): string | null {
  const base = publicUrlBase();
  if (!publicUrl.startsWith(base + "/")) return null;
  return publicUrl.slice(base.length + 1);
}
