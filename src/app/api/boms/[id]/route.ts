// src/app/api/boms/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bom from "@/models/Bom";
import { zUpdateBom } from "@/lib/validation/stock";

type RouteParams = { id: string };
type RouteContext = { params: Record<string, string | string[]> };

function getId(ctx: RouteContext): string {
  const v = ctx.params["id"];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export async function GET(_req: Request, ctx: RouteContext) {
  await dbConnect();

  const id = getId(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const bom = await Bom.findById(id)
    .populate("finishedItemId")
    .populate("lines.componentItemId");

  if (!bom) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: bom });
}

export async function PUT(req: Request, ctx: RouteContext) {
  await dbConnect();

  const id = getId(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const body: unknown = await req.json();
  const parsed = zUpdateBom.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await Bom.findByIdAndUpdate(id, parsed.data, { new: true })
    .populate("finishedItemId")
    .populate("lines.componentItemId");

  if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: updated });
}
