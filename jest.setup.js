// Configuración global para pruebas de Jest
jest.mock('./utils/error/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn()
}));
process.env.EMAIL_FROM = "test@example.com";

// Mock completo para el cliente de Supabase
jest.mock('./utils/supabase/server', () => {
  // Función para crear un objeto de respuesta estándar
  const createMockQueryBuilder = (defaultData = []) => {
    // Método para resolver la promesa al final de la cadena
    const resolvePromise = jest.fn().mockImplementation(function() {
      // Si 'single' fue el último método llamado, devolvemos un solo elemento
      if (this._isSingle) {
        return Promise.resolve({
          data: defaultData.length > 0 ? defaultData[0] : { id: 1 },
          error: null
        });
      }
      
      // De lo contrario, devolvemos todos los datos
      return Promise.resolve({
        data: defaultData,
        error: null
      });
    });
    
    // Objeto base con todos los métodos de consulta
    const queryBuilder = {
      // Estado interno
      _isSingle: false,
      _data: defaultData,
      
      // Métodos de filtrado
      eq: jest.fn(function() { return this; }),
      neq: jest.fn(function() { return this; }),
      gt: jest.fn(function() { return this; }),
      gte: jest.fn(function() { return this; }),
      lt: jest.fn(function() { return this; }),
      lte: jest.fn(function() { return this; }),
      like: jest.fn(function() { return this; }),
      ilike: jest.fn(function() { return this; }),
      is: jest.fn(function() { return this; }),
      in: jest.fn(function() { return this; }),
      contains: jest.fn(function() { return this; }),
      containedBy: jest.fn(function() { return this; }),
      range: jest.fn(function() { return this; }),
      textSearch: jest.fn(function() { return this; }),
      filter: jest.fn(function() { return this; }),
      not: jest.fn(function() { return this; }),
      or: jest.fn(function() { return this; }),
      and: jest.fn(function() { return this; }),
      
      // Métodos de paginación y ordenamiento
      order: jest.fn(function() { return this; }),
      limit: jest.fn(function() { return this; }),
      offset: jest.fn(function() { return this; }),
      
      // Métodos para obtener resultados
      single: jest.fn(function() { 
        this._isSingle = true;
        return this;
      }),
      maybeSingle: jest.fn(function() { 
        this._isSingle = true;
        return this;
      }),
      
      // El método 'then' permite usar la cadena como una promesa
      then: resolvePromise,
      
      // Permite devolver directamente los datos y el error simulado
      data: defaultData,
      error: null
    };
    
    return queryBuilder;
  };
  
  // Mock para la función select
  const selectFn = jest.fn(() => createMockQueryBuilder());
  
  // Mock para operaciones de datos (insert, update, delete)
  const createDataOpResponse = (defaultData = { id: 1 }) => ({
    select: jest.fn(() => createMockQueryBuilder([defaultData])),
    single: jest.fn().mockResolvedValue({
      data: defaultData,
      error: null
    }),
    then: jest.fn().mockResolvedValue({
      data: defaultData,
      error: null
    })
  });
  
  return {
    createClient: jest.fn(() => Promise.resolve({
      from: jest.fn(() => ({
        select: selectFn,
        update: jest.fn(() => createDataOpResponse()),
        insert: jest.fn(() => createDataOpResponse()),
        delete: jest.fn(() => createDataOpResponse()),
        upsert: jest.fn(() => createDataOpResponse())
      }))
    }))
  };
});
