export default {
	resolver: 'ts-jest-resolver',
	testEnvironment: 'node',
	testMatch: [ '<rootDir>/lib/**/*.spec.ts' ],
	collectCoverage: true,
	collectCoverageFrom: [ '<rootDir>/lib/**' ],
	coverageReporters: [ 'lcov', 'text', 'html' ],
	extensionsToTreatAsEsm: ['.ts'],
};
