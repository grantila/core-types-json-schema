export type {
	ConvertCoreTypesToJsonSchemaOptions,
} from './lib/core-types-to-json-schema.js'
export {
	decorateSchema,
	convertCoreTypesToJsonSchema,
} from './lib/core-types-to-json-schema.js'

export type {
	ConvertJsonSchemaToCoreTypesOptions,
} from './lib/json-schema-to-core-types.js'
export {
	convertJsonSchemaToCoreTypes,
} from './lib/json-schema-to-core-types.js'

export {
	CoreTypesToOpenApiOptions,
	convertCoreTypesToOpenApi,
	convertOpenApiToCoreTypes,
} from './lib/open-api.js'

export {
	OpenApiSchemaTypeDefinition,
	jsonSchemaDocumentToOpenApi,
	openApiToJsonSchema,
} from 'openapi-json-schema'

export * as helpers from './lib/annotations.js'
