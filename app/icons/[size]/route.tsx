import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/AppIcon";

const SIZES = [192, 512];

export function generateStaticParams() {
  return SIZES.map((s) => ({ size: String(s) }));
}

export async function GET(_req: Request, ctx: RouteContext<"/icons/[size]">) {
  const { size } = await ctx.params;
  const px = SIZES.includes(Number(size)) ? Number(size) : 192;
  return new ImageResponse(<AppIconArt size={px} />, { width: px, height: px });
}
