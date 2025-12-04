// /app/api/uploads/cloudinary/route.ts
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import type {
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

export const runtime = "nodejs"; // aseguramos runtime Node (no Edge)

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || undefined;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No se recibió ningún archivo" },
        { status: 400 },
      );
    }

    const blob = file as Blob;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "auto", // imágenes, videos, etc.
          },
          (
            error: UploadApiErrorResponse | undefined,
            uploadResult: UploadApiResponse | undefined,
          ) => {
            if (error || !uploadResult) {
              return reject(
                error ?? new Error("Error al subir archivo a Cloudinary"),
              );
            }
            resolve(uploadResult);
          },
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: unknown) {
    console.error("Error subiendo a Cloudinary:", error);

    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Error al subir el archivo";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
