// Tipos de ayuda para los mocks de Jest en TypeScript

// Extender la interfaz global jest para proporcionar tipos adecuados para los mocks
declare namespace jest {
  // Proporcionar la definición de tipo para jest.Mock
  interface Mock<T = any, Y extends any[] = any[]> {
    new (...args: Y): T;
    (...args: Y): T;
    mockImplementation(fn: (...args: Y) => T): this;
    mockImplementationOnce(fn: (...args: Y) => T): this;
    mockReturnValue(value: T): this;
    mockReturnValueOnce(value: T): this;
    mockResolvedValue(value: T extends Promise<infer U> ? U : T): this;
    mockResolvedValueOnce(value: T extends Promise<infer U> ? U : T): this;
    mockRejectedValue(value: any): this;
    mockRejectedValueOnce(value: any): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): this;
  }
}

export {};
