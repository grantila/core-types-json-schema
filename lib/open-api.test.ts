import {  simplify } from 'core-types'
import { PartialOpenApiSchema } from 'openapi-json-schema'

import {
	convertCoreTypesToOpenApi,
	convertOpenApiToCoreTypes,
} from './open-api.js'


describe( "Open API", ( ) =>
{
	describe( "Two-way conversion circle", ( ) =>
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

		it( "As string", ( ) =>
		{
			const { data } = convertOpenApiToCoreTypes(
				JSON.stringify( openApi )
			);

			const { data: same } = convertCoreTypesToOpenApi(
				simplify( data ),
				{ title: 'the title', version: '1' }
			);

			delete same.info['x-comment'];
			expect( same ).toStrictEqual( openApi );
		} );

		it( "As string", ( ) =>
		{
			const { data } = convertOpenApiToCoreTypes( openApi );

			const { data: same } = convertCoreTypesToOpenApi(
				simplify( data ),
				{ title: 'the title', version: '1' }
			);

			delete same.info['x-comment'];
			expect( same ).toStrictEqual( openApi );
		} );
	} );
} );
