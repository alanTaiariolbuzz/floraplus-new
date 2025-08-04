import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import swaggerJSDoc from "swagger-jsdoc";

async function main() {
  try {
    const options: swaggerJSDoc.Options = {
      definition: {
        openapi: "3.0.3",
        info: {
          title: "API Documentation",
          version: "1.0.0",
          description: "Documentación completa de la API",
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [
          {
            BearerAuth: [],
          },
        ],
      },
      apis: ["./app/api/**/*.ts"],
    };

    const spec = swaggerJSDoc(options);

    // Asegurar que el directorio public existe
    const publicDir = join(process.cwd(), "public");
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = join(process.cwd(), "public/openapi.json");
    writeFileSync(outputPath, JSON.stringify(spec, null, 2));

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();
