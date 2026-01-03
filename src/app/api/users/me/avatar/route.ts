import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import type {
  UploadApiOptions,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

export const runtime = "nodejs";

function uploadToCloudinary(buffer: Buffer, options: UploadApiOptions) {
  return new Promise<Pick<UploadApiResponse, "secure_url" | "public_id">>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error || !result) return reject(error ?? new Error("Error subiendo imagen"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );

    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("No autorizado", { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ success: false, error: "Debe ser una imagen" }, { status: 400 });
  }

  const maxBytes = 4 * 1024 * 1024; // 4MB
  if (file.size > maxBytes) {
    return NextResponse.json({ success: false, error: "La imagen supera 4MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const folder = process.env.CLOUDINARY_FOLDER || "avatars";
  const publicId = `${folder}/${session.user.id}`;

  const uploaded = await uploadToCloudinary(bytes, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
    transformation: [
      { width: 256, height: 256, crop: "fill", gravity: "face" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });

  await dbConnect();
  await User.findByIdAndUpdate(session.user.id, { image: uploaded.secure_url }, { new: true });

  return NextResponse.json({ success: true, data: { image: uploaded.secure_url } });
}
