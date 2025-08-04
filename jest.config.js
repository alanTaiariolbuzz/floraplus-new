const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Proporcionar la ruta a tu app de Next.js
  dir: './',
});

// Configuración de Jest personalizada
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Maneja las importaciones de módulos
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-node',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/app/api/__tests__/mocks/'
  ],
  transform: {
    // Usa babel-jest para transpiler archivos con extensiones js, jsx, ts y tsx
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

// createJestConfig se exporta de esta manera para asegurar que next/jest pueda cargar la configuración de Next.js
module.exports = createJestConfig(customJestConfig);
