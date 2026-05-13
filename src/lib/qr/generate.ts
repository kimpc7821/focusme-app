import QRCode from "qrcode";

export async function generateQrPng(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    width: 1024,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

export function buildTargetUrl(args: {
  baseUrl: string;
  slug: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): string {
  const url = new URL(`${args.baseUrl.replace(/\/$/, "")}/p/${args.slug}`);
  if (args.utmSource) url.searchParams.set("utm_source", args.utmSource);
  if (args.utmMedium) url.searchParams.set("utm_medium", args.utmMedium);
  if (args.utmCampaign) url.searchParams.set("utm_campaign", args.utmCampaign);
  return url.toString();
}
