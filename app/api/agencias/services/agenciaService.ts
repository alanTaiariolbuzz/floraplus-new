import { createClient } from "../../../../utils/supabase/server";
import { logError } from "../../../../utils/error/logger";
import { logInfo } from "../../../../utils/error/logger";
import { logWarning } from "../../../../utils/error/logWarning";
import { AgenciaData, FiltrosAgencia } from "../types";
import { syncAgencyStatusWithStripe } from "../../../../utils/stripe/sync";

export async function getAgencias(filtros: FiltrosAgencia = {}) {
  const supabase = await createClient();
  const { activa } = filtros;

  try {
    let query = supabase
      .from("agencias")
      .select("*")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("id");

    // Aplicar filtros si existen
    if (activa !== undefined) {
      logInfo("Filtrando agencias por estado activa", { activa });
      query = query.eq("activa", activa);
    }

    const { data, error } = await query;

    if (error) {
      logWarning("Error recibido de Supabase al obtener agencias", { error });
      throw error;
    }

    // Sincronizar el estado de Stripe para todas las agencias que tengan stripe_account_id
    if (data && data.length > 0) {
      const syncPromises = data
        .filter((agencia) => agencia.stripe_account_id)
        .map((agencia) =>
          syncAgencyStatusWithStripe(agencia.stripe_account_id)
        );

      // Ejecutar sincronizaciones en paralelo sin esperar el resultado
      Promise.allSettled(syncPromises)
        .then((results) => {
          const successful = results.filter(
            (r) => r.status === "fulfilled"
          ).length;
          const failed = results.filter((r) => r.status === "rejected").length;
          if (successful > 0 || failed > 0) {
            logInfo("Sincronización de estados de Stripe completada", {
              successful,
              failed,
              total: data.length,
            });
          }
        })
        .catch((err) => {
          logError(err, {
            service: "agenciaService",
            context: "background-sync-stripe-status",
            message: "Error en sincronización en segundo plano",
          });
        });
    }

    logInfo("Agencias obtenidas correctamente", { count: data?.length });
    return data || [];
  } catch (err: any) {
    logError(err, {
      message: "Error en getAgencias",
      service: "agenciaService",
      filtros,
    });

    throw {
      code: 500,
      message: "Error al obtener agencias",
    };
  }
}

export async function getAgenciaById(id: number) {
  const supabase = await createClient();

  try {
    logInfo("Buscando agencia por ID", { id });
    const { data, error } = await supabase
      .from("agencias")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        logWarning("Agencia no encontrada", { id });
        throw {
          code: 404,
          message: `Agencia con ID ${id} no encontrada`,
        };
      }
      logWarning("Error recibido de Supabase al buscar agencia por ID", {
        error,
        id,
      });
      throw error;
    }
    logInfo("Agencia encontrada", { id, agencia: data });
    return data;
  } catch (err: any) {
    logError(err, {
      message: `Error en getAgenciaById (id: ${id})`,
      service: "agenciaService",
      id,
    });
    if (err.code && err.message) {
      throw err;
    }
    throw {
      code: 500,
      message: "Error al obtener agencia",
    };
  }
}

/**
 * Crea una nueva agencia
 * @param agenciaData Datos de la agencia a crear
 * @returns La agencia creada o un error
 */
export async function createAgencia(agenciaData: AgenciaData) {
  const supabase = await createClient();

  try {
    logInfo("Creando nueva agencia", {
      email: agenciaData.email_contacto,
      nombre: agenciaData.nombre,
    });
    const now = new Date().toISOString();

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
        logInfo("Términos y condiciones obtenidos de la configuración general", {
          context: "createAgencia",
          agenciaId: primeraAgencia.id,
        });
      }
    } catch (error) {
      logError("Error al obtener TYC de configuración general", {
        context: "createAgencia",
        error,
      });
    }

    // Usar los TYC de configuración general si están disponibles, sino usar los proporcionados o un valor por defecto
    const terminosCondiciones = tycConfiguracionGeneral || 
                               agenciaData.termino_cond || 
                               "Términos y condiciones por defecto";

    // Crear objeto para inserción con manejo consistente de valores nulos
    // Confiamos en los valores por defecto proporcionados por Zod en el schema
    const agenciaInsert = {
      nombre: agenciaData.nombre,
      email_contacto: agenciaData.email_contacto,
      telefono: agenciaData.telefono || null, // Uso consistente de null para campos opcionales no proporcionados
      direccion: agenciaData.direccion || null,
      termino_cond: terminosCondiciones,
      moneda: agenciaData.moneda || "USD", // Este default es de negocio, no redundante con Zod
      activa: agenciaData.activa, // Confiamos en el default de Zod
      cedula: agenciaData.cedula || null,
      web: agenciaData.web || null,
      pais: agenciaData.pais || null,
      nombre_comercial: agenciaData.nombre_comercial || null,
      fee: agenciaData.fee || null,
      tax: agenciaData.tax || null,
      convenience_fee_fijo: agenciaData.convenience_fee_fijo === true,
      convenience_fee_fijo_valor:
        agenciaData.convenience_fee_fijo_valor || null,
      convenience_fee_variable: agenciaData.convenience_fee_variable === true,
      convenience_fee_variable_valor:
        agenciaData.convenience_fee_variable_valor || null,
      nombre_representante: agenciaData.nombre_representante || null, // Nuevo campo opcional
      nombre_departamento_reservas: agenciaData.nombre_departamento_reservas || null,
      email_departamento_reservas: agenciaData.email_departamento_reservas || null,
      telefono_departamento_reservas: agenciaData.telefono_departamento_reservas || null,
      created_at: now,
      updated_at: now,
    };

    // Insertar la nueva agencia
    const { data, error } = await supabase
      .from("agencias")
      .insert(agenciaInsert)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        logWarning("Intento de crear agencia duplicada", {
          email: agenciaData.email_contacto,
        });
        throw {
          code: 409,
          message: "Ya existe una agencia con esa información",
        };
      }
      logWarning("Error recibido de Supabase al crear agencia", {
        error,
        email: agenciaData.email_contacto,
      });
      throw error;
    }
    logInfo("Agencia creada exitosamente", {
      id: data?.id,
      email: agenciaData.email_contacto,
    });
    return data;
  } catch (err: any) {
    logError(err, {
      service: "agenciaService",
      context: "Error en createAgencia",
      data: { email: agenciaData.email_contacto, nombre: agenciaData.nombre },
    });
    if (err.code && err.message) {
      throw err;
    }
    throw {
      code: 500,
      message: "Error al crear agencia",
    };
  }
}

/**
 * Actualiza una agencia existente
 * @param id ID de la agencia a actualizar
 * @param agenciaData Datos de la agencia a actualizar
 * @returns La agencia actualizada o un error
 */
export async function updateAgencia(
  id: number,
  agenciaData: Partial<AgenciaData>
) {
  const supabase = await createClient();

  try {
    logInfo("Actualizando agencia", {
      id,
      updateFields: Object.keys(agenciaData),
    });
    // Verificar que la agencia exista
    const { data: agenciaExistente, error: errorBusqueda } = await supabase
      .from("agencias")
      .select("id")
      .eq("id", id)
      .single();

    if (errorBusqueda || !agenciaExistente) {
      logWarning("Intento de actualizar agencia no existente", { id });
      throw {
        code: 404,
        message: "Agencia no encontrada",
      };
    }

    const now = new Date().toISOString();

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: now,
    };

    // Solo incluir campos que estén definidos
    if (agenciaData.nombre !== undefined)
      updateData.nombre = agenciaData.nombre;
    if (agenciaData.email_contacto !== undefined)
      updateData.email_contacto = agenciaData.email_contacto;
    if (agenciaData.telefono !== undefined)
      updateData.telefono = agenciaData.telefono;
    if (agenciaData.direccion !== undefined)
      updateData.direccion = agenciaData.direccion;
    if (agenciaData.termino_cond !== undefined)
      updateData.termino_cond = agenciaData.termino_cond;
    if (agenciaData.moneda !== undefined)
      updateData.moneda = agenciaData.moneda;
    if (agenciaData.activa !== undefined)
      updateData.activa = agenciaData.activa;
    if (agenciaData.cedula !== undefined)
      updateData.cedula = agenciaData.cedula;
    if (agenciaData.web !== undefined) updateData.web = agenciaData.web;
    if (agenciaData.pais !== undefined) updateData.pais = agenciaData.pais;
    if (agenciaData.nombre_comercial !== undefined)
      updateData.nombre_comercial = agenciaData.nombre_comercial;
    if (agenciaData.fee !== undefined) updateData.fee = agenciaData.fee;
    if (agenciaData.tax !== undefined) updateData.tax = agenciaData.tax;
    if (agenciaData.convenience_fee_fijo !== undefined)
      updateData.convenience_fee_fijo = agenciaData.convenience_fee_fijo === true;
    if (agenciaData.convenience_fee_fijo_valor !== undefined)
      updateData.convenience_fee_fijo_valor =
        agenciaData.convenience_fee_fijo_valor;
    if (agenciaData.convenience_fee_variable !== undefined)
      updateData.convenience_fee_variable =
        agenciaData.convenience_fee_variable === true;
    if (agenciaData.convenience_fee_variable_valor !== undefined)
      updateData.convenience_fee_variable_valor =
        agenciaData.convenience_fee_variable_valor;
    if (agenciaData.nombre_representante !== undefined)
      updateData.nombre_representante = agenciaData.nombre_representante;
    if (agenciaData.nombre_departamento_reservas !== undefined)
      updateData.nombre_departamento_reservas = agenciaData.nombre_departamento_reservas;
    if (agenciaData.email_departamento_reservas !== undefined)
      updateData.email_departamento_reservas = agenciaData.email_departamento_reservas;
    if (agenciaData.telefono_departamento_reservas !== undefined)
      updateData.telefono_departamento_reservas = agenciaData.telefono_departamento_reservas;

    // Actualizar la agencia
    const { data, error } = await supabase
      .from("agencias")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      logWarning("Error recibido de Supabase al actualizar agencia", {
        error,
        id,
      });
      throw error;
    }
    logInfo("Agencia actualizada exitosamente", { id });
    return data;
  } catch (err: any) {
    logError(err, {
      service: "agenciaService",
      context: "Error en updateAgencia",
      id,
      updateFields: Object.keys(agenciaData),
    });
    if (err.code && err.message) {
      throw err;
    }
    throw {
      code: 500,
      message: "Error al actualizar agencia",
    };
  }
}

/**
 * Desactiva una agencia (eliminación lógica)
 * @param id ID de la agencia a desactivar
 * @returns La agencia desactivada o un mensaje de que ya estaba desactivada
 */
export async function deactivateAgencia(id: number) {
  const supabase = await createClient();

  try {
    logInfo("Desactivando agencia", { id });
    // Verificar que la agencia exista
    const { data: agenciaExistente, error: errorBusqueda } = await supabase
      .from("agencias")
      .select("id, nombre, activa")
      .eq("id", id)
      .single();

    if (errorBusqueda || !agenciaExistente) {
      logWarning("Intento de desactivar agencia no existente", { id });
      throw {
        code: 404,
        message: "Agencia no encontrada",
      };
    }

    if (!agenciaExistente.activa) {
      logInfo("Agencia ya estaba desactivada", { id });
      return { message: "La agencia ya estaba desactivada" };
    }

    // Desactivar la agencia (eliminación lógica)
    const { data, error } = await supabase
      .from("agencias")
      .update({ activa: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      logWarning("Error recibido de Supabase al desactivar agencia", {
        error,
        id,
      });
      throw error;
    }
    logInfo("Agencia desactivada exitosamente", { id });
    return data;
  } catch (err: any) {
    logError(err, {
      service: "agenciaService",
      context: "Error en deactivateAgencia",
      id,
    });
    if (err.code && err.message) {
      throw err;
    }
    throw {
      code: 500,
      message: "Error al desactivar agencia",
    };
  }
}
