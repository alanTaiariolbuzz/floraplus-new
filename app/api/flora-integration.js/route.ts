import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    // Leer el archivo JavaScript desde la carpeta public
    const filePath = join(process.cwd(), "public", "flora-integration.js");
    const fileContent = readFileSync(filePath, "utf8");

    // Retornar el archivo con los headers correctos
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=86400", // Cache por 24 horas
        "Access-Control-Allow-Origin": "*", // Permitir CORS
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error serving flora-integration.js:", error);
    return new NextResponse("// Error: Flora+ Integration Script not found", {
      status: 404,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
}
