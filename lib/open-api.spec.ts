import {  simplify } from 'core-types'
import { PartialOpenApiSchema } from 'openapi-json-schema'
import {
	convertCoreTypesToOpenApi,
	convertOpenApiToCoreTypes,
} from './open-api'


describe( "Open API", ( ) =>
{
	it( "Full circle", ( ) =>
	{
		const openApi: PartialOpenApiSchema = {
			info: {
				title: 'the title',
				version: '1',
			},
			openapi: '3.0.0',
			paths: { },
			components: {
				schemas: {
					Foo: {
						type: 'object',
						properties: {
							bar: { type: 'string', nullable: true },
						},
					}
				},
			},
		};

		const { data } = convertOpenApiToCoreTypes( openApi );

		const { data: same } = convertCoreTypesToOpenApi(
			simplify( data ),
			{ title: 'the title', version: '1' }
		);

		delete ( same as any ).$comment;
		expect( same ).toStrictEqual( openApi );
	} );
} );
