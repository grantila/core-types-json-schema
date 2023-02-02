import { JSONSchema7 } from 'json-schema'
import { ConversionResult, NodeDocument } from 'core-types'
import {
	PartialOpenApiSchema,
	JsonSchemaDocumentToOpenApiOptions,
	jsonSchemaDocumentToOpenApi,
	openApiToJsonSchema,
} from 'openapi-json-schema'

import {
	ConvertCoreTypesToJsonSchemaOptions,
	convertCoreTypesToJsonSchema,
} from './core-types-to-json-schema.js'
import { convertJsonSchemaToCoreTypes } from './json-schema-to-core-types.js'


export type CoreTypesToOpenApiOptions =
	& JsonSchemaDocumentToOpenApiOptions
	& ConvertCoreTypesToJsonSchemaOptions;

export function convertCoreTypesToOpenApi(
	doc: NodeDocument,
	options: CoreTypesToOpenApiOptions
)
: ConversionResult< PartialOpenApiSchema >
{
	const { data: jsonSchema, ...rest } =
		convertCoreTypesToJsonSchema( doc, options );

	return {
		...rest,
		data: jsonSchemaDocumentToOpenApi( jsonSchema, options )
	};
}

export function convertOpenApiToCoreTypes(
	schema: PartialOpenApiSchema | string
)
: ConversionResult< NodeDocument >
{
	// TODO: Implement JSON AST parsing and a source map separately to
	//       the tree (src path -> target path)
	schema = typeof schema === 'string' ? JSON.parse( schema ) : schema;

	const jsonSchema = openApiToJsonSchema( schema );
	return convertJsonSchemaToCoreTypes( jsonSchema as JSONSchema7 );
}
