import { NamedType, NodeDocument, simplify } from 'core-types'
import { convertJsonSchemaToCoreTypes } from './json-schema-to-core-types'


const wrapRoot = ( types: Array< NamedType > ): NodeDocument => ( {
	version: 1,
	types
} );

describe( "convertJsonSchemaToCoreTypes", ( ) =>
{
	it( "Invalid schema (without definitions)", ( ) =>
	{
		const ct = convertJsonSchemaToCoreTypes( {
			type: "string",
		} );

		expect( ct ).toStrictEqual( wrapRoot( [ ] ) );
	} );

	it( "One simple type", ( ) =>
	{
		const ct = convertJsonSchemaToCoreTypes( {
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
		const ct = convertJsonSchemaToCoreTypes( {
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
		const ct = convertJsonSchemaToCoreTypes( {
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
} );
