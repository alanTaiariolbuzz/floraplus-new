// Type definitions for Jest

declare namespace jest {
  // Mocks
  function fn<T extends (...args: any[]) => any>(implementation?: T): jest.Mock<ReturnType<T>, Parameters<T>>;
  function mock(moduleName: string, factory?: any, options?: any): typeof jest;
  function requireActual(moduleName: string): any;
  function clearAllMocks(): typeof jest;
  function resetAllMocks(): typeof jest;
  function spyOn<T, K extends keyof T>(object: T, method: K): jest.SpyInstance;

  interface Mock<TReturn, TArgs extends any[] = any[]> {
    (...args: TArgs): TReturn;
    mockImplementation(fn: (...args: TArgs) => TReturn): this;
    mockReturnValue(value: TReturn): this;
    mockResolvedValue(value: Awaited<TReturn>): this;
    mockRejectedValue(value: any): this;
    getMockName(): string;
    mockClear(): this;
    mock: {
      calls: TArgs[];
      instances: TReturn[];
      invocationCallOrder: number[];
      results: { type: string; value: TReturn }[];
    };
  }

  interface SpyInstance<TReturn, TArgs extends any[] = any[]> extends Mock<TReturn, TArgs> {
    mockRestore(): void;
  }
}

declare const describe: (name: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const beforeAll: (fn: () => void) => void;
declare const afterAll: (fn: () => void) => void;
declare const it: (name: string, fn: () => void, timeout?: number) => void;
declare const test: typeof it;
declare const expect: any;
