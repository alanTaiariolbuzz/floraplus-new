"use client";

import { useEffect, useState } from "react";
// @ts-ignore
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si el archivo openapi.json existe
  useEffect(() => {
    const checkOpenApiFile = async () => {
      try {
        const res = await fetch("/openapi.json");
        if (!res.ok) {
          setHasError(true);
        }
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkOpenApiFile();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Documentación de la API
          </h1>
          <p className="text-muted-foreground">
            Explora y prueba todos los endpoints disponibles
          </p>
        </div>

        {isLoading && (
          <div className="bg-card rounded-lg border shadow-sm p-8 text-center">
            <p>Cargando documentación...</p>
          </div>
        )}

        {hasError && !isLoading && (
          <div className="bg-card rounded-lg border shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-4 text-red-500">
              Error al cargar la documentación
            </h2>
            <p className="mb-4">
              No se pudo encontrar el archivo openapi.json. Por favor asegúrate
              de:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Ejecutar{" "}
                <code className="bg-gray-100 px-1 rounded">
                  npm run build:openapi
                </code>{" "}
                para generar el archivo
              </li>
              <li>
                Verificar que el archivo exista en la carpeta{" "}
                <code className="bg-gray-100 px-1 rounded">public/</code>
              </li>
              <li>Reiniciar el servidor de desarrollo</li>
            </ol>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!hasError && !isLoading && (
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <SwaggerUI
              url="/openapi.json"
              docExpansion="none"
              deepLinking={true}
              displayRequestDuration={true}
              tryItOutEnabled={true}
              requestInterceptor={(req: {
                headers: { [x: string]: string };
              }) => {
                // Interceptar requests para añadir headers adicionales si es necesario
                req.headers["Content-Type"] =
                  req.headers["Content-Type"] || "application/json";
                return req;
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
