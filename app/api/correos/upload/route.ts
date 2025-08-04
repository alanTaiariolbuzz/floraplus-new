import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logError, logInfo } from "../../../../utils/error/logger";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const agenciaId = formData.get("agencia_id") as string;

    if (!file) {
      return NextResponse.json(
        {
          code: 400,
          message: "Archivo requerido",
        },
        { status: 400 }
      );
    }

    if (!agenciaId) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de agencia requerido",
        },
        { status: 400 }
      );
    }

    const agenciaIdNum = parseInt(agenciaId, 10);
    if (isNaN(agenciaIdNum)) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de agencia inválido",
        },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          code: 400,
          message:
            "Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, SVG).",
        },
        { status: 400 }
      );
    }

    // Validar tamaño (100KB para emails)
    const maxSize = 100 * 1024; // 100KB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          code: 400,
          message:
            "El archivo es demasiado grande. El tamaño máximo es 100KB para optimizar emails.",
        },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase
    const supabase = await createClient();

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `logo_agencia_${agenciaIdNum}_${timestamp}.${fileExtension}`;

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("logos-agencias")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logError("Error al subir archivo a Supabase Storage", {
        context: "correos/upload",
        error: uploadError,
        agenciaId: agenciaIdNum,
        fileName,
      });

      return NextResponse.json(
        {
          code: 500,
          message: "Error al subir el archivo",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from("logos-agencias")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    logInfo("Archivo subido exitosamente", {
      context: "correos/upload",
      agenciaId: agenciaIdNum,
      fileName,
      publicUrl,
      fileSize: file.size,
    });

    return NextResponse.json(
      {
        code: 200,
        message: "Archivo subido exitosamente",
        data: {
          logo_url: publicUrl,
          logo_filename: fileName,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("Error en POST /api/correos/upload", {
      context: "correos/upload",
      error,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
