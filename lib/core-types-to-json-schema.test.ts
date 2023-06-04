import { NamedType, NodeDocument } from 'core-types'
import { JSONSchema7 } from 'json-schema'

import { convertCoreTypesToJsonSchema } from './core-types-to-json-schema.js'


const wrapRoot = ( types: Array< NamedType > ): NodeDocument => ( {
	version: 1,
	types
} );

const convertWrapper = ( doc: NodeDocument ): JSONSchema7 =>
{
	const { data } = convertCoreTypesToJsonSchema( doc );
	const { $comment, ...rest } = data;
	return rest;
}

describe( 'convertCoreTypesToJsonSchema', ( ) =>
{
	it( 'One simple type', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'foo',
				type: 'string',
			}
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				foo: {
					type: 'string'
				}
			}
		} );
	} );

	it( 'Included default comment', ( ) =>
	{
		const { data: js } = convertCoreTypesToJsonSchema( wrapRoot( [
			{
				name: 'foo',
				type: 'string',
			}
		] ) );

		expect( js ).toStrictEqual( {
			$comment: expect.stringMatching( /core-types/ ),
			definitions: {
				foo: {
					type: 'string'
				}
			}
		} );
	} );

	it( 'Included custom comment', ( ) =>
	{
		const { data: js } = convertCoreTypesToJsonSchema( wrapRoot( [
			{
				name: 'foo',
				type: 'string',
			}
		] ), { userPackage: 'foo', userPackageUrl: 'foo.com' } );

		expect( js ).toStrictEqual( {
			$comment: expect.stringMatching( /core-types.*foo.*foo\.com/ ),
			definitions: {
				foo: {
					type: 'string'
				}
			}
		} );
	} );

	it( 'Two types', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'foo',
				type: 'string',
			},
			{
				name: 'bar',
				type: 'object',
				properties: {
					foo: { required: true, node: { type: 'ref', ref: 'foo' } }
				},
				additionalProperties: false,
			}
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				foo: {
					type: 'string'
				},
				bar: {
					type: 'object',
					properties: {
						foo: { $ref: '#/definitions/foo' }
					},
					required: [ 'foo' ],
					additionalProperties: false,
				}
			}
		} );
	} );

	it( 'Primitives', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 's',
				type: 'string',
			},
			{
				name: 'nl',
				type: 'null',
			},
			{
				name: 'b',
				type: 'boolean',
			},
			{
				name: 'n',
				type: 'number',
			},
			{
				name: 'i',
				type: 'integer',
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				s: {
					type: 'string'
				},
				nl: {
					type: 'null',
				},
				b: {
					type: 'boolean',
				},
				n: {
					type: 'number',
				},
				i: {
					type: 'integer',
				},
				}
		} );
	} );

	it( 'Arrays', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'arr',
				type: 'array',
				elementType: { type: 'string' },
				enum: [ [ 'foo' ], [ 'bar' ] ],
				description: 'either foo or bar',
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				arr: {
					type: 'array',
					items: { type: 'string' },
					enum: [ [ 'foo' ], [ 'bar' ] ],
					description: 'either foo or bar',
				},
			}
		} );
	} );

	it( 'Convert simple anyOf to type array', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'or',
				type: 'or',
				or: [
					{ type: 'string' },
					{ type: 'number' },
				],
				description: 'either string or number',
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				or: {
					type: [ 'string', 'number' ],
					description: 'either string or number',
				},
			}
		} );
	} );

	it( 'Convert simple (but with title) anyOf to type array', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'or',
				type: 'or',
				or: [
					{ type: 'string', title: 'or-string' },
					{ type: 'number', title: 'or-number' },
				],
				description: 'either string or number',
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				or: {
					type: [ 'string', 'number' ],
					description: 'either string or number',
				},
			}
		} );
	} );

	it( 'Tuple', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'tup',
				type: 'tuple',
				elementTypes: [ { type: 'string' }, { type: 'number' } ],
				additionalItems: false,
				minItems: 1,
				enum: [ [ 'foo' ], [ 'foo', 42 ] ],
				description: 'either foo or foo+42',
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				tup: {
					type: 'array',
					items: [ { type: 'string' }, { type: 'number' } ],
					additionalItems: false,
					minItems: 1,
					enum: [ [ 'foo' ], [ 'foo', 42] ],
					description: 'either foo or foo+42',
				},
			}
		} );
	} );

	it( 'Complex types - unions', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'union',
				type: 'or',
				or: [
					{ type: 'string', enum: [ 'foo', 'bar' ] },
					{ type: 'number' },
				],
				description: 'either or',
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				union: {
					anyOf: [
						{ type: 'string', enum: [ 'foo', 'bar' ] },
						{ type: 'number' },
					],
					description: 'either or',
				},
			}
		} );
	} );

	it( 'Complex types - unions of simple types (only type constraint)', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'union',
				type: 'or',
				or: [
					{ type: 'string' },
					{ type: 'number' },
				],
				description: 'either or',
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				union: {
					type: [ 'string', 'number' ],
					description: 'either or',
				},
			}
		} );
	} );

	it( 'Complex types - intersections', ( ) =>
	{
		const js = convertWrapper( wrapRoot( [
			{
				name: 'intersec',
				type: 'and',
				and: [
					{ type: 'string', enum: [ 'foo', 'bar' ] },
					{ type: 'number' },
				],
				description: 'both'
			},
		] ) );

		expect( js ).toStrictEqual( {
			definitions: {
				intersec: {
					allOf: [
						{ type: 'string', enum: [ 'foo', 'bar' ] },
						{ type: 'number' },
					],
					description: 'both'
				},
			}
		} );
	} );
} );
