import type { JSONSchema7 } from "json-schema"
import { ensureArray, NodeType } from 'core-types'


export function annotate( node: NodeType, jsonSchema: JSONSchema7 ): JSONSchema7
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
