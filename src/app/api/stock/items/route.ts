import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";

  const filter: Record<string, unknown> = { active: true };
  if (type) filter.type = type;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  const items = await Item.find(filter)
    .select("sku name brand category uom type")
    .sort({ category: 1, name: 1 })
    .limit(200)
    .lean();

  return NextResponse.json({ ok: true, data: items });
}
