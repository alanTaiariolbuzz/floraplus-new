import { createClient } from "@/utils/supabase/server";
import { CreateNuevaAgenciaInput } from "./schema";
import { logError, logInfo } from "@/utils/error/logger";

export const createAgencia = async ({
  agenciaData,
}: {
  agenciaData: CreateNuevaAgenciaInput;
}) => {
  const supabase = await createClient();
  try {
    // Log the attempt to create a new agency
    logInfo(`Creando nueva agencia: ${agenciaData.agencia.nombre_sociedad}`, {
      context: "service:createAgencia",
    });

    // Obtener campos opcionales con valores predeterminados
    const condicionesComerciales = agenciaData.condiciones_comerciales || {};
    const configuracionFees = agenciaData.configuracion_fees || {};
    const adminUser = agenciaData.usuario_administrador;
    const agencia = agenciaData.agencia;

    // Obtener los términos y condiciones de la configuración general (primera agencia)
    let tycConfiguracionGeneral = "";
    try {
      const { data: primeraAgencia, error: tycError } = await supabase
        .from("agencias")
        .select("id, termino_cond")
        .order("id", { ascending: true })
        .limit(1)
        .single();

      if (!tycError && primeraAgencia?.termino_cond) {
        tycConfiguracionGeneral = primeraAgencia.termino_cond;
        logInfo(
          "Términos y condiciones obtenidos de la configuración general",
          {
            context: "service:createAgencia",
            agenciaId: primeraAgencia.id,
          }
        );
      }
    } catch (error) {
      logError("Error al obtener TYC de configuración general", {
        context: "service:createAgencia",
        error,
      });
    }

    // Usar los TYC de configuración general si están disponibles, sino usar los proporcionados o un valor por defecto
    const terminosCondiciones =
      tycConfiguracionGeneral ||
      condicionesComerciales.terminos_condiciones ||
      "Términos y condiciones por defecto";

    const { data, error } = await supabase
      .from("agencias")
      .insert({
        nombre: agencia.nombre_sociedad,
        email_contacto: adminUser.mail,
        telefono: adminUser.telefono || "",
        direccion: agencia.direccion || "",
        termino_cond: terminosCondiciones,
        activa: false,
        nombre_comercial: agencia.nombre_comercial || agencia.nombre_sociedad, // Usar nombre_sociedad como respaldo
        cedula: agencia.cedula_juridica || null,
        pais: agencia.pais || null,
        web: agencia.sitio_web || null,
        convenience_fee_fijo: configuracionFees.convenience_fee_fijo === true,
        convenience_fee_fijo_valor:
          configuracionFees.convenience_fee_fijo_valor || null,
        convenience_fee_variable:
          configuracionFees.convenience_fee_variable === true,
        convenience_fee_variable_valor:
          configuracionFees.convenience_fee_variable_valor || null,
        tax: configuracionFees.tax || null,
        fee: condicionesComerciales.comision || 0,
        nombre_representante: adminUser.nombre || null, // Nuevo campo opcional
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      const errorObj = new Error(`Error al crear agencia: ${error.message}`);
      logError(errorObj, {
        context: "service:createAgencia",
      });
      return errorObj;
    }

    logInfo(`Agencia creada con éxito: ${data.id}`, {
      context: "service:createAgencia",
    });
    return data;
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Error desconocido");
    logError(errorObj, {
      context: "service:createAgencia",
    });
    return errorObj;
  }
};
