import { encodePathPart, decodePathPart } from "core-types"


export function encodeRefName( name: string ): string
{
	return `#/definitions/${encodePathPart( name )}`;
}

export function decodeRefName( name: string ): string
{
	if ( name.startsWith( "#/definitions/" ) )
		return decodePathPart( name.slice( 14 ) );
	return decodePathPart( name );
}
