import { NamedType, NodeDocument, simplify } from 'core-types'

import { convertJsonSchemaToCoreTypes } from './json-schema-to-core-types.js'
import { JSONSchema7 } from 'json-schema';


const wrapRoot = ( types: Array< NamedType > ): NodeDocument => ( {
	version: 1,
	types
} );

describe( "convertJsonSchemaToCoreTypes", ( ) =>
{
	it( "Invalid schema (without definitions)", ( ) =>
	{
		const { data: ct } = convertJsonSchemaToCoreTypes( {
			type: "string",
		} );

		expect( ct ).toStrictEqual( wrapRoot( [ ] ) );
	} );

	it( "One simple type", ( ) =>
	{
		const { data: ct } = convertJsonSchemaToCoreTypes( {
			definitions: {
				foo: { type: "string" },
			},
		} );

		expect( ct ).toStrictEqual(
			wrapRoot( [ { name: 'foo', type: 'string' } ] )
		);
	} );

	it( "Complex types anyOf", ( ) =>
	{
		const { data: ct } = convertJsonSchemaToCoreTypes( {
			definitions: {
				AnyOfInlineSameType: {
					anyOf: [
						{ type: "string" },
						{ maxLength: 4 }
					]
				},
				AnyOfInlineMerged: {
					anyOf: [
						{
							type: "object",
							properties: { foo: { type: "string" } }
						},
						{
							type: "object",
							properties: { bar: { type: "string" } },
							required: [ "bar" ]
						}
					]
				},
				AnyOfRefsMerged: {
					anyOf: [
						{ $ref: "#/definitions/Type1" },
						{ $ref: "#/definitions/Type2" }
					]
				},
				Type1: {
					type: "object",
					properties: { foo: { type: "string" } }
				},
				Type2: {
					type: "object",
					properties: { bar: { type: "string" } },
					required: [ "bar" ]
				}
			}
		} );

		const expected: Array< NamedType > = [
			{ name: 'AnyOfInlineSameType', type: 'any' },
			{
				name: 'AnyOfInlineMerged',
				type: 'or',
				or: [
					{
						type: 'object',
						properties: {
							foo: { node: { type: 'string' }, required: false }
						},
						additionalProperties: true
					},
					{
						type: 'object',
						properties: {
							bar: { node: { type: 'string' }, required: true }
						},
						additionalProperties: true
					}
				],
			},
			{
				name: 'AnyOfRefsMerged',
				type: 'or',
				or: [
					{ type: 'ref', ref: 'Type1' },
					{ type: 'ref', ref: 'Type2' },
				],
			},
			{
				name: 'Type1',
				type: 'object',
				properties: {
					foo: { node: { type: 'string' }, required: false }
				},
				additionalProperties: true,
			},
			{
				name: 'Type2',
				type: 'object',
				properties: {
					bar: { node: { type: 'string' }, required: true }
				},
				additionalProperties: true,
			}
		];

		expect( simplify( ct ) ).toStrictEqual( wrapRoot( expected ) );
	} );

	it( "Complex types allOf", ( ) =>
	{
		const { data: ct } = convertJsonSchemaToCoreTypes( {
			definitions: {
				AllOfInlineSameType: {
					allOf: [
						{ type: "string" },
						{ maxLength: 4 }
					]
				},
				AllOfInlineMerged: {
					allOf: [
						{
							type: "object",
							properties: { foo: { type: "string" } }
						},
						{
							type: "object",
							properties: { bar: { type: "string" } },
							required: [ "bar" ]
						}
					]
				},
				AllOfRefsMerged: {
					allOf: [
						{ $ref: "#/definitions/Type1" },
						{ $ref: "#/definitions/Type2" }
					]
				},
				Type1: {
					type: "object",
					properties: { foo: { type: "string" } }
				},
				Type2: {
					type: "object",
					properties: { bar: { type: "string" } },
					required: [ "bar" ]
				}
			}
		} );

		const expected: Array< NamedType > = [
			{ name: 'AllOfInlineSameType', type: 'string' },
			{
				name: 'AllOfInlineMerged',
				type: 'and',
				and: [
					{
						type: 'object',
						properties: {
							foo: { node: { type: 'string' }, required: false }
						},
						additionalProperties: true
					},
					{
						type: 'object',
						properties: {
							bar: { node: { type: 'string' }, required: true }
						},
						additionalProperties: true
					}
				],
			},
			{
				name: 'AllOfRefsMerged',
				type: 'and',
				and: [
					{ type: 'ref', ref: 'Type1' },
					{ type: 'ref', ref: 'Type2' },
				],
			},
			{
				name: 'Type1',
				type: 'object',
				properties: {
					foo: { node: { type: 'string' }, required: false }
				},
				additionalProperties: true,
			},
			{
				name: 'Type2',
				type: 'object',
				properties: {
					bar: { node: { type: 'string' }, required: true }
				},
				additionalProperties: true,
			}
		];

		expect( simplify( ct ) ).toStrictEqual( wrapRoot( expected ) );
	} );

	describe( "additionalProperties", ( ) =>
	{
		it( "default", ( ) =>
		{
			const { data: ct } = convertJsonSchemaToCoreTypes( {
				definitions: {
					foo: {
						type: "object",
						properties: {
							foo: { type: "string" },
						},
					},
				},
			} );

			expect( ct ).toStrictEqual(
				wrapRoot( [ {
					name: 'foo',
					type: 'object',
					properties: {
						foo: {
							required: false,
							node: {
								type: "string",
							},
						},
					},
					additionalProperties: true,
				} ] )
			);
		} );

		it( "false", ( ) =>
		{
			const { data: ct } = convertJsonSchemaToCoreTypes( {
				definitions: {
					foo: {
						type: "object",
						properties: {
							foo: { type: "string" },
						},
					},
				},
			}, {
				defaultAdditionalProperties: false,
			} );

			expect( ct ).toStrictEqual(
				wrapRoot( [ {
					name: 'foo',
					type: 'object',
					properties: {
						foo: {
							required: false,
							node: {
								type: "string",
							},
						},
					},
					additionalProperties: false,
				} ] )
			);
		} );

		it( "additionalProperties (default)", ( ) =>
		{
			const { data: ct } = convertJsonSchemaToCoreTypes( {
				definitions: {
					foo: {
						type: "object",
						properties: {
							foo: { type: "string" },
						},
					},
				},
			}, {
				defaultAdditionalProperties: { type: "boolean" },
			} );

			expect( ct ).toStrictEqual(
				wrapRoot( [ {
					name: 'foo',
					type: 'object',
					properties: {
						foo: {
							required: false,
							node: {
								type: "string",
							},
						},
					},
					additionalProperties: { type: "boolean" },
				} ] )
			);
		} );

	} );

	// Ensures https://github.com/grantila/typeconv/issues/34
	it( "allOf combined with type", ( ) =>
	{
		const baseSchema = {
			$id: 'base',
			type: 'object',
			required: ['id'],
			properties: {
				id: {
					description: 'Content uniq ID.',
					type: 'string',
				},
			},
		} satisfies JSONSchema7;

		const schema = {
			allOf: [baseSchema],
			$id: 'something',
			type: 'object',
			title: 'CMS Product Documentation',
			required: ['title', 'excerpt'],
			properties: {
				title: {
					type: 'string',
					description: 'Content title',
					maxLength: 30,
				},
				excerpt: {
					type: 'string',
					description: 'Short description of post.',
					minLength: 15,
					maxLength: 300,
				},
			},
		} satisfies JSONSchema7;

		const contentSchema = {
			definitions: {
				'Something': schema,
			},
		} satisfies JSONSchema7;

		const { data } = convertJsonSchemaToCoreTypes( contentSchema );
		const something = simplify( data.types[ 0 ], { mergeObjects: true } );

		expect( something ).toMatchSnapshot( );
	} );
} );
