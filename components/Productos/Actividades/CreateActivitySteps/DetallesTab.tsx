import React, { useState, useEffect, useCallback, useRef } from "react";

interface DetallesTabProps {
  initialValues?: {
    minimo_reserva?: number;
    limite_reserva_minutos?: number | null;
    umbral_limite_personas?: number | null;
    umbral_limite_minutos?: number | null;
    umbral_limite_tipo?: string | null;
    configuracion_condicional?: boolean;
  };
  onChange: (values: any) => void;
}

const DetallesTab: React.FC<DetallesTabProps> = ({
  initialValues = {},
  onChange,
}) => {
  // Estados simples
  const [minimoReserva, setMinimoReserva] = useState(
    initialValues.minimo_reserva || 1
  );
  const [stopAcceptingEnabled, setStopAcceptingEnabled] = useState(
    initialValues.limite_reserva_minutos !== null
  );
  const [stopAcceptingHours, setStopAcceptingHours] = useState(
    initialValues.limite_reserva_minutos
      ? Math.floor(initialValues.limite_reserva_minutos / 60)
      : 0
  );
  const [stopAcceptingMinutes, setStopAcceptingMinutes] = useState(
    initialValues.limite_reserva_minutos
      ? initialValues.limite_reserva_minutos % 60
      : 0
  );
  const [conditionalEnabled, setConditionalEnabled] = useState(
    initialValues.configuracion_condicional || false
  );
  const [conditionalPersons, setConditionalPersons] = useState(
    initialValues.umbral_limite_personas || minimoReserva + 1
  );
  const [conditionalHours, setConditionalHours] = useState(
    initialValues.umbral_limite_minutos
      ? Math.floor(initialValues.umbral_limite_minutos / 60)
      : 0
  );
  const [conditionalMinutes, setConditionalMinutes] = useState(
    initialValues.umbral_limite_minutos
      ? initialValues.umbral_limite_minutos % 60
      : 0
  );
  const [conditionalType, setConditionalType] = useState(
    initialValues.umbral_limite_tipo || "antes"
  );

  // Helper function to call onChange with current values
  const notifyChange = useCallback(() => {
    // Calcular los minutos totales para cada configuración
    const limiteReservaMinutos = stopAcceptingEnabled
      ? stopAcceptingHours * 60 + stopAcceptingMinutes
      : null;

    const umbralLimiteMinutos = conditionalEnabled
      ? conditionalHours * 60 + conditionalMinutes
      : null;

    // Generar el objeto detalles con el formato correcto
    const detalles = {
      limite_reserva_minutos: limiteReservaMinutos,
      umbral_limite_personas: conditionalEnabled ? conditionalPersons : null,
      umbral_limite_minutos: umbralLimiteMinutos,
      umbral_limite_tipo: conditionalEnabled ? conditionalType : null,
    };



    // Generar el objeto completo para mantener compatibilidad
    const data = {
      minimo_reserva: minimoReserva,
      ...detalles,
      configuracion_condicional: conditionalEnabled,
    };

 

    onChange(data);
  }, [
    minimoReserva,
    stopAcceptingEnabled,
    stopAcceptingHours,
    stopAcceptingMinutes,
    conditionalEnabled,
    conditionalPersons,
    conditionalHours,
    conditionalMinutes,
    conditionalType,
    onChange,
  ]);

  return (
    <div className="p-6 border border-gray-300 rounded-lg">
      <h6 className="text-lg font-semibold text-gray-900 mb-4">
        Configuración de reservas
      </h6>

      <div className="space-y-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad mínima de personas para esta actividad
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={minimoReserva}
            onChange={(e) => {
              const newValue = Number(e.target.value);

              setMinimoReserva(newValue);
              // Update conditionalPersons if it's less than the new minimum
              if (conditionalPersons <= newValue) {
                setConditionalPersons(newValue + 1);
              }
            }}
            onBlur={() => {

              notifyChange();
            }}
            min={1}
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-[#F47920] focus:ring-[#F47920] border-gray-300 rounded"
                checked={stopAcceptingEnabled}
                onChange={(e) => {
                  setStopAcceptingEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setStopAcceptingHours(0);
                    setStopAcceptingMinutes(0);
                  }
                }}
                onBlur={() => {

                  notifyChange();
                }}
              />
              <span className="ml-2 text-sm text-gray-700">
                Dejar de aceptar reservas
              </span>
            </label>

            <div className="flex items-center space-x-2 ml-4">
              <div>
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={stopAcceptingHours}
                  onChange={(e) => {

                    setStopAcceptingHours(Number(e.target.value));
                  }}
                  onBlur={() => {

                    notifyChange();
                  }}
                  disabled={!stopAcceptingEnabled}
                  min={0}
                />
              </div>
              {/* if input > 1 show horas < show hora without plural */}
              <span className="text-sm text-gray-600">
                {stopAcceptingHours === 1 ? "Hora" : "Horas"}
              </span>
              <div>
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={stopAcceptingMinutes}
                  onChange={(e) => {

                    setStopAcceptingMinutes(Number(e.target.value));
                  }}  
                  onBlur={() => {

                    notifyChange();
                  }}
                  disabled={!stopAcceptingEnabled}
                  min={0}
                  max={59}
                />
              </div>
              <span className="text-sm text-gray-600">
                Minutos antes del inicio de la actividad
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          Por ejemplo, si dejas de aceptar reservas 2 horas antes del inicio,
          para una reserva que empieza a las 10am vas a poder recibir reservas
          hasta las 8am.
        </p>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-3 mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-[#F47920] focus:ring-[#F47920] border-gray-300 rounded"
                checked={conditionalEnabled}
                onChange={(e) => {
                  setConditionalEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setConditionalPersons(minimoReserva + 1);
                    setConditionalHours(0);
                    setConditionalMinutes(0);
                    setConditionalType("antes");
                  }
                }}
                onBlur={() => {
                  notifyChange();
                }}
              />
              <span className="ml-2 text-sm text-gray-700">
                Si tengo más de
              </span>
            </label>

            <div className="flex items-center space-x-2 ml-4">
              <div>
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={conditionalPersons}
                  onChange={(e) => {

                    setConditionalPersons(Number(e.target.value));
                  }}
                  onBlur={() => {

                    notifyChange();
                  }}
                  disabled={!conditionalEnabled}
                  min={minimoReserva + 1}
                />
              </div>
              <span className="text-sm text-gray-700">
                personas en esta actividad, quiero aceptar reservas
              </span>
              <div>
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={conditionalHours}  
                  onChange={(e) => {

                    setConditionalHours(Number(e.target.value));
                  }}
                  onBlur={() => {

                    notifyChange();
                  }}
                  disabled={!conditionalEnabled}
                  min={0}
                />
              </div>
              <span className="text-sm text-gray-700">
                {conditionalHours === 1 ? "Hora" : "Horas"}
              </span>
              <div>
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={conditionalMinutes}
                  onChange={(e) => {

                    setConditionalMinutes(Number(e.target.value));
                  }}
                  onBlur={() => {

                    notifyChange();
                  }}
                  disabled={!conditionalEnabled}
                  min={0}
                  max={59}
                />
              </div>
              <span className="text-sm text-gray-700">Minutos</span>
            </div>
          </div>
          <div>
            <select
              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={conditionalType}
              onChange={(e) => {
                setConditionalType(e.target.value);
              }}
              onBlur={() => {
                notifyChange();
              }}
              disabled={!conditionalEnabled}
            >
              <option value="antes">Antes</option>
              <option value="despues">Después</option>
            </select>
            <span className="text-sm text-gray-700 ml-4">
              {conditionalType === "antes" ? "antes" : "después"} de la
              actividad
            </span>
          </div>
          <span className="text-xs text-gray-700 mt-4">
            Por ejemplo, si más de 5 personas ya reservaron, quiero dejar de
            aceptar reservas 1 hora antes de la hora de inicio.
          </span>
        </div>
      </div>
    </div>
  );
};

export default DetallesTab;
