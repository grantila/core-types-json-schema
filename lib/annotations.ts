import type { JSONSchema7 } from "json-schema"
import {
	CoreTypeAnnotations,
	ensureArray,
	NodeType,
	stringify,
} from 'core-types'


export function annotateJsonSchema(
	node: CoreTypeAnnotations,
	jsonSchema: JSONSchema7
)
: JSONSchema7
{
	const description: string | undefined =
		!node.description && !node.see
		? undefined
		: mergeDescriptionAndSee( node.description, node.see );

	return {
		...jsonSchema,
		...( !node.title ? { } : { title: node.title } ),
		...( !description ? { } : { description } ),
		...( !node.default ? { } : { default: node.default } ),
		...( !node.examples ? { } : { examples: node.examples } ),
		...( !node.comment ? { } : { $comment: node.comment } ),
	};
}

export function annotateCoreTypes( node: NodeType, jsonSchema: JSONSchema7 )
: NodeType
{
	const { description, see } =
		splitDescriptionAndSee( jsonSchema.description ?? '' )

	const annotations: CoreTypeAnnotations = {
		...(
			jsonSchema.title
			? { title: jsonSchema.title }
			: { }
		),
		...(
			jsonSchema.default
			? { default: stringify( jsonSchema.default ) }
			: { }
		),
		...(
			jsonSchema.examples
			? { examples: stringify( jsonSchema.examples ) }
			: { }
		),
		...(
			jsonSchema.$comment
			? { comment: jsonSchema.$comment }
			: { }
		),
		...( description ? { description } : { } ),
		...( ( see && see.length > 0 ) ? { see } : { } ),
	};

	return { ...annotations, ...node };
}

function mergeDescriptionAndSee(
	description: NodeType[ 'description' ],
	see: NodeType[ 'see' ]
)
: string | undefined
{
	const seeAsString = ( ) =>
		ensureArray( see )
		.map( see => `@see ${see}` )
		.join( "\n" );

	if ( description && see?.length )
	{
		return description + "\n\n" + seeAsString( );
	}
	return description ? description : seeAsString( );
}

function splitDescriptionAndSee( data?: string )
: Pick< NodeType, 'description' | 'see' >
{
	const lines = ( data ?? '' ).split( "\n" );
	const see: Array< string > = [ ];

	while (
		lines.length > 0
		&&
		lines[ lines.length - 1 ].startsWith( '@see ' )
	)
		see.push( ( lines.pop( ) as string ).slice( 5 ) );

	while ( lines.length > 0 && !lines[ lines.length - 1 ].trim( ) )
		lines.pop( );

	return {
		description: lines.join( "\n" ),
		see,
	};
}
