import type {
	JSONSchema7,
	JSONSchema7Definition,
	JSONSchema7TypeName,
} from "json-schema"
import type {
	AndType,
	NamedType,
	NodeType,
	RefType,
	Comparable,
	GenericTypeInfo,
	ObjectProperty,
	NodeDocument,
	ConversionResult,
} from "core-types"
import {
	CoreTypesErrorMeta,
	UnsupportedError,
	MalformedTypeError,
	isEqual,
	intersection,
	union,
	ensureArray,
} from "core-types"

import { decodeRefName } from './utils'
import { getAstByString, getAstByObject, getLocation } from 'jsonpos'


interface Context
{
	locByPath( ): CoreTypesErrorMeta;
	path: Array< string | number >;
	throwUnsupportedError( message: string, meta: CoreTypesErrorMeta ): never;
}

const walkDown = ( ctx: Context, child: string | number ): Context =>
	( { ...ctx, path: [ ...ctx.path, child ] } );

export function convertJsonSchemaToCoreTypes( schema: JSONSchema7 | string )
: ConversionResult< NodeDocument >
{
	const parsed =
		typeof schema === 'string'
		? getAstByString( schema )
		: getAstByObject( schema );
	const { json } = parsed;

	const { definitions } = json;

	const doc: NodeDocument = {
		version: 1,
		types: Object
			.keys( definitions ?? { } )
			.map( name =>
			{
				const typeSchema = ( definitions ?? { } )[ name ];

				const ctx: Context = {
					locByPath( )
					{
						return {
							path: this.path,
							loc: getLocation(
								parsed,
								{ dataPath: this.path, markIdentifier: true }
							),
						};
					},
					path: [ 'definitions', name ],
					throwUnsupportedError( message, meta )
					{
						meta = { ...meta };
						if ( !meta.path )
							meta.path = this.path;
						if ( !meta.loc )
							meta.loc = getLocation(
								parsed,
								{ dataPath: this.path, markIdentifier: true }
							);
						throw new UnsupportedError( message, meta );
					}
				};
				const node = fromSchema( typeSchema, ctx );

				const namedNode: NamedType< NodeType > = { ...node, name };
				return namedNode;
			} ),
	};

	return {
		data: doc,
		convertedTypes: doc.types.map( ( { name } ) => name ),
		notConvertedTypes: [ ],
	};
}

export const complexProps =
	new Set( [ 'anyOf', 'allOf', 'oneOf', 'then', 'else' ] );

/**
 * If a schema has an anyOf, allOf or oneOf, or (if-)then-else, the parent type
 * info will be pushed down to these (not overwriting, but prepending)
 */
function pushDown( schema: JSONSchema7, ctx: Context ): JSONSchema7
{
	const {
		$ref,
		type, // JSONSchema7TypeName | JSONSchema7TypeName[];
		enum: _enum, ///: JSONSchema7Type[];
		const: _const, // : JSONSchema7Type;

		items, // JSONSchema7Definition | JSONSchema7Definition[];
		additionalItems, // JSONSchema7Definition;

		required, // string[];
		properties, // { [key: string]: JSONSchema7Definition; };
		// patternProperties, // { [key: string]: JSONSchema7Definition; };
		additionalProperties, // JSONSchema7Definition;

		then, // JSONSchema7Definition;
		else: _else, // JSONSchema7Definition;
		allOf: _allOf, // JSONSchema7Definition[];
		anyOf: _anyOf, // JSONSchema7Definition[];
		oneOf: _oneOf, // JSONSchema7Definition[];
	} = schema;

	const allOf =
		!_allOf || typeof _allOf !== 'object'
		? null
		: _allOf.filter( ( entry ): entry is JSONSchema7 =>
			entry && typeof entry === 'object'
		);
	const anyOf =
		!_anyOf || typeof _anyOf !== 'object'
		? null
		: _anyOf.filter( ( entry ): entry is JSONSchema7 =>
			entry && typeof entry === 'object'
		);
	const oneOf =
		!_oneOf || typeof _oneOf !== 'object'
		? null
		: _oneOf.filter( ( entry ): entry is JSONSchema7 =>
			entry && typeof entry === 'object'
		);

	const mergeDown = (
		container: 'then' | 'else' | 'allOf' | 'anyOf' | 'oneOf',
		subSchema: JSONSchema7
	) =>
	{
		const isOnlyOrSame = < T extends Comparable >( a: T, b: T ) =>
			!( a && b && !isEqual( a, b ) );

		if ( !isOnlyOrSame( $ref, subSchema.$ref ) )
			ctx.throwUnsupportedError(
				`Cannot have $ref in a node *and* in its '${container}'`,
				{
					blob: schema
				}
			);

		if ( !isOnlyOrSame( type, subSchema.type ) )
			ctx.throwUnsupportedError(
				`Cannot have 'type' in a node *and* in its '${container}'`,
				{
					blob: schema
				}
			);

		if ( _enum )
		{
			if ( !subSchema.enum )
				subSchema.enum = _enum;
			else
			{
				const newEnum = intersection( _enum, subSchema.enum );
				if ( newEnum.length === 0 )
					throw new MalformedTypeError(
						"Cannot merge types with non-intersecting enums",
						{
							path: ctx.path,
							blob: {
								child: [ ...ctx.path, container ],
							}
						}
					);
				subSchema.enum = newEnum;
			}
		}

		if ( _const !== undefined )
		{
			if ( subSchema.const !== undefined )
			{
				if ( isEqual( _const, subSchema.const ) )
					throw new MalformedTypeError(
						"Cannot merge types with mismatching const",
						{
							path: ctx.path,
							blob: {
								child: [ ...ctx.path, container ],
							}
						}
					);
			}
			else
				subSchema.const = _const;
		}

		subSchema.items = subSchema.items ?? items;
		subSchema.additionalItems =
			subSchema.additionalItems ?? additionalItems;

		if ( required !== undefined || subSchema.required !== undefined )
			subSchema.required =
				union( subSchema.required ?? [ ], required ?? [ ] );

		if (
			( typeof properties === 'undefined' ) !==
			( typeof subSchema.properties === 'undefined' )
		)
			subSchema.properties ??= properties;
		else if ( typeof properties !== 'undefined' )
		{
			const propA = properties as NonNullable< typeof properties >;
			const propB =
				subSchema.properties as NonNullable< typeof properties >;
			// Merge properties
			const keysA = Object.keys( propA );
			const keysB = Object.keys( propB );
			const combinedKeys = union( keysA, keysB );
			const ret: JSONSchema7[ 'properties' ] = { };
			combinedKeys.forEach( key =>
			{
				if ( propA[ key ] !== undefined )
					ret[ key ] = propB[ key ];
				else if ( propB[ key ] !== undefined )
					ret[ key ] = propA[ key ];
				else
					// Merge
					ret[ key ] = { allOf: [ propA[ key ], propB[ key ] ] };
			} );
		}

		if (
			( typeof additionalProperties === 'undefined' ) !==
			( typeof subSchema.additionalProperties === 'undefined' )
		)
			subSchema.additionalProperties ??= additionalProperties;
		else if ( typeof additionalProperties !== 'undefined' )
		{
			// Merge
			subSchema.additionalProperties = {
				allOf: [
					subSchema.additionalProperties as JSONSchema7Definition,
					additionalProperties as JSONSchema7Definition
				]
			};
		}

		// TODO: Consider implementing fallback support for patternProperties

		// TODO: Implement annotations
		// title // string;
		// description // string;
		// _default // JSONSchema7Type;
		// examples // JSONSchema7Type;
	};

	if ( then && typeof then === 'object' )
		mergeDown( 'then', then );
	if ( _else && typeof _else === 'object' )
		mergeDown( 'else', _else );
	if ( allOf && typeof allOf === 'object' )
		allOf.forEach( entry => mergeDown( 'allOf', entry ) );
	if ( anyOf && typeof anyOf === 'object' )
		anyOf.forEach( entry => mergeDown( 'anyOf', entry ) );
	if ( oneOf && typeof oneOf === 'object' )
		oneOf.forEach( entry => mergeDown( 'oneOf', entry ) );

	return {
		...( then && typeof then === 'object' ? { then } : { } ),
		...( _else && typeof _else === 'object' ? { else: _else } : { } ),
		...( allOf && typeof allOf === 'object' ? { allOf } : { } ),
		...( anyOf && typeof anyOf === 'object' ? { anyOf } : { } ),
		...( oneOf && typeof oneOf === 'object' ? { oneOf } : { } ),
	};
}

/**
 * If a schema has an anyOf, allOf or oneOf, or (if-)then-else, these will be
 * converted to the core-types type 'and' or 'or':
 *   - anyOf, oneOf and [then, else] become an 'or' type
 *   - allOf becomes an 'and' type
 */
function fromComplex( schema: JSONSchema7, ctx: Context ): AndType
{
	const {
		then,
		else: _else,
		allOf,
		anyOf,
		oneOf,
	} = schema;

	const conditionals = [
		...( then ? [ [ walkDown( ctx, 'then' ), then ] ] as const : [ ] ),
		...( _else ? [ [ walkDown( ctx, 'else' ), _else ] ] as const : [ ] ),
	];
	const ors = [
		...(
			anyOf
			? anyOf.map( ( node, index ) =>
				[ walkDown( walkDown( ctx, 'anyOf' ), index ), node ] as const
			)
			: [ ]
		),
		...(
			oneOf
			? oneOf.map( ( node, index ) =>
				[ walkDown( walkDown( ctx, 'oneOf' ), index ), node ] as const
			)
			: [ ]
		),
	];
	const ands = [
		...(
			allOf
			? allOf.map( ( node, index ) =>
				[ walkDown( walkDown( ctx, 'allOf' ), index ), node ] as const
			)
			: [ ]
		),
	];

	return {
		type: 'and',
		and: [
			{
				type: 'or',
				or: conditionals.map( ( [ ctx, v ] ) => fromSchema( v, ctx ) ),
			},
			{
				type: 'or',
				or: ors.map( ( [ ctx, v ] ) => fromSchema( v, ctx ) ),
			},
			{
				type: 'and',
				and: ands.map( ( [ ctx, v ] ) => fromSchema( v, ctx ) ),
			},
		]
	};
}

function isComplex( schema: JSONSchema7 )
{
	return typeof schema === 'object' &&
		Object.keys( schema ).some( prop => complexProps.has( prop ) );
}

function fromSchema( schema: JSONSchema7Definition, ctx: Context ): NodeType
{
	if ( typeof schema === 'boolean' )
		ctx.throwUnsupportedError(
			"Boolean JSON Schema definition not supported",
			{ blob: { schema } }
		);
	else if ( isComplex( schema ) )
		return fromComplex( pushDown( schema, ctx ), ctx );

	if ( typeof schema === 'undefined' )
		ctx.throwUnsupportedError(
			`Internal error`,
			{ blob: { schema } }
		);

	const makeRefType = ( ref: string ): RefType =>
		( { type: 'ref', ref: decodeRefName( ref ) } );

	const wrapRefType = < T extends NodeType >( node: T ): T | AndType =>
		schema.$ref === undefined
		? node
		: {
			type: 'and',
			and: [ node, makeRefType( schema.$ref ) ],
		}

	const { const: _const, enum: _enum } = schema;

	const constEnum: GenericTypeInfo< any > = {
		...( typeof _const !== 'undefined' ? { const: _const } : { } ),
		...( typeof _enum !== 'undefined' ? { enum: _enum } : { } ),
	};

	if ( schema.type === undefined )
	{
		if ( schema.$ref )
			return { ...makeRefType( schema.$ref ), ...constEnum };
		else
			return { type: 'any', ...constEnum };
	}

	const types = ensureArray( schema.type )
		.map( type => fromSchemaAndType( schema, type, constEnum, ctx ) );

	if ( types.length === 1 )
		return wrapRefType( types[ 0 ] );
	return wrapRefType( { type: 'or', or: types } );
}

function fromSchemaAndType(
	schema: JSONSchema7,
	type: JSONSchema7TypeName,
	constEnum: GenericTypeInfo< any >,
	ctx: Context
)
: NodeType
{
	// TODO: Implement annotations

	if ( isPrimitiveType( type ) )
	{
		if ( type === 'null' )
			return { type: 'null' };
		else
			return { type, ...constEnum };
	}
	else if ( type === 'array' )
	{
		if ( Array.isArray( schema.items ) )
		{
			return {
				type: 'tuple',
				elementTypes: schema.items.map( item =>
					fromSchema( item, walkDown( ctx, 'items' ) )
				),
				additionalItems:
					typeof schema.additionalItems === 'undefined'
					? true
					: typeof schema.additionalItems === 'boolean'
					? schema.additionalItems
					: fromSchema(
						schema.additionalItems,
						walkDown( ctx, 'additionalItems' )
					),
				minItems: schema.minItems ?? 0,
				...constEnum,
			};
		}
		else if ( schema.items === false )
		{
			return {
				type: 'tuple',
				elementTypes: [ ],
				additionalItems: false,
				minItems: 0,
				...constEnum,
			};
		}
		else
		{
			return {
				type: 'array',
				elementType:
					(
						typeof schema.items === 'undefined' ||
						schema.items === true
					)
					? { type: 'any' }
					: fromSchema( schema.items, walkDown( ctx, 'items' ) ),
				...constEnum,
			};
		}
	}
	else if ( type === 'object' )
	{
		const required = new Set( schema.required ?? [ ] );
		return {
			type: 'object',
			properties: Object.fromEntries(
				Object.entries( schema.properties ?? { } )
				.map( ( [ prop, value ] ): [ string, ObjectProperty ] => [
					prop,
					{
						node: fromSchema(
							value,
							walkDown( walkDown( ctx, 'properties' ), prop )
						),
						required: required.has( prop ),
					}
				] )
			),
			additionalProperties:
				typeof schema.additionalProperties === 'undefined'
				? true
				: typeof schema.additionalProperties === 'boolean'
				? schema.additionalProperties
				: fromSchema(
					schema.additionalProperties,
					walkDown( ctx, 'additionalProperties' )
				),
			...constEnum,
		};
	}
	else
		ctx.throwUnsupportedError(
			`Unsupported JSON Schema type "${type}"`, { blob: { schema } }
		);
}

type SingleType = Exclude< JSONSchema7[ "type" ], any[ ] | undefined >;

const isPrimitiveType = ( type: SingleType )
	: type is "string" | "number" | "integer" | "boolean" | "null" =>
	[ "string", "number", "integer", "boolean", "null" ].includes( type );
