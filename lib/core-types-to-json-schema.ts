import type { JSONSchema7 } from "json-schema"
import type {
	NodeType,
	GenericTypeInfo,
	NodeWithConstEnum,
	NodeDocument,
} from 'core-types'
import { UnsupportedError } from 'core-types'

import { encodeRefName } from './utils'
import { annotate } from "./annotations"


export interface ConvertCoreTypesToJsonSchemaOptions
{
	sourceFilename?: string;
	filename?: string;
	userPackage?: string;
	userPackageUrl?: string;
}

function decorateSchema(
	schema: JSONSchema7,
	{
		filename,
		sourceFilename,
		userPackage,
		userPackageUrl,
	}: ConvertCoreTypesToJsonSchemaOptions
)
{
	if ( typeof filename !== 'undefined' )
		schema.$id ??= filename;

	const thisName = 'core-types-json-schema';
	const thisUrl = 'https://github.com/grantila/core-types-json-schema';
	const onbehalf =
		!userPackage && !userPackageUrl
		? ''
		: userPackage && userPackageUrl
		? `${userPackage} (${userPackageUrl})`
		: userPackage ? userPackage : userPackageUrl;

	const fromFilenameComment =
		sourceFilename
		? ` from ${sourceFilename}`
		: '';

	schema.$comment ??=
		`Generated${fromFilenameComment} by ` +
		`${thisName} (${thisUrl})` +
		( onbehalf ? ` on behalf of ${onbehalf}` : '' );
}

export function convertCoreTypesToJsonSchema(
	doc: NodeDocument,
	options?: ConvertCoreTypesToJsonSchemaOptions
)
: JSONSchema7
{
	const { version, types } = doc;
	if ( version !== 1 )
		throw new UnsupportedError(
			`core-types version ${version} not supported`
		);

	const schema: JSONSchema7 = {
		definitions: Object.fromEntries( types.map( node =>
			[ node.name, toJsonSchema( node ) ]
		) )
	};

	decorateSchema( schema, options ?? { } );

	return schema;
}

function toJsonSchema( node: NodeType ): JSONSchema7
{
	if ( node.type === 'any' )
		return annotate( node, constEnum( node, { } ) );
	else if ( node.type === 'null' )
		return annotate( node, { type: 'null' } );
	else if ( node.type === 'boolean' )
		return annotate( node, constEnum( node, { type: 'boolean' } ) );
	else if ( node.type === 'string' )
		return annotate( node, constEnum( node, { type: 'string' } ) );
	else if ( node.type === 'number' )
		return annotate( node, constEnum( node, { type: 'number' } ) );
	else if ( node.type === 'integer' )
		return annotate( node, constEnum( node, { type: 'integer' } ) );
	else if ( node.type === 'and' )
		return annotate( node, {
			allOf: node.and.map( subNode => toJsonSchema( subNode ) ),
		} );
	else if ( node.type === 'or' )
		return annotate( node, {
			anyOf: node.or.map( subNode => toJsonSchema( subNode ) ),
		} );
	else if ( node.type === 'object' )
	{
		const allKeys = Object.keys( node.properties );

		const required = allKeys
			.filter( prop => node.properties[ prop ].required );

		const properties = Object.fromEntries(
			allKeys
			.map( prop =>
				[ prop, toJsonSchema( node.properties[ prop ].node ) ]
			)
		);

		return annotate( node, constEnum( node, {
			type: 'object',
			...( allKeys.length > 0 ? { properties } : { } ),
			...( required.length > 0 ? { required } : { } ),
			...(
				node.additionalProperties === true
				? { }
				: !node.additionalProperties
				? { additionalProperties: false }
				: {
					additionalProperties:
						toJsonSchema( node.additionalProperties )
				}
			),
		} ) );
	}
	else if ( node.type === 'array' )
		return annotate( node, constEnum( node, {
			type: 'array',
			items: toJsonSchema( node.elementType ),
		} ) );
	else if ( node.type === 'tuple' )
		return annotate( node, constEnum( node, {
			type: 'array',
			items: node.elementTypes.map( item => toJsonSchema( item ) ),
			...(
				node.additionalItems === true
				? { }
				: !node.additionalItems
				? { additionalItems: false }
				: { additionalItems: toJsonSchema( node.additionalItems ) }
			),
			minItems: node.minItems,
		} ) );
	else if ( node.type === 'ref' )
		return annotate( node, constEnum( node, {
			$ref: encodeRefName( node.ref ),
		} ) );
	else
		throw new UnsupportedError(
			`core-types node of type ${( node as any ).type} not supported`,
			node
		);
}

function constEnum< T extends NodeWithConstEnum[ 'const' ] >(
	node: GenericTypeInfo< T >,
	jsonSchema: JSONSchema7
)
: JSONSchema7
{
	if ( node.const !== undefined )
		return { ...jsonSchema, const: node.const as JSONSchema7[ 'const' ] };
	if ( node.enum )
		return { ...jsonSchema, enum: node.enum as JSONSchema7[ 'enum' ] };
	return jsonSchema;
}
