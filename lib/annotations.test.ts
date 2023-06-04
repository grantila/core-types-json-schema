import { annotateCoreTypes, annotateJsonSchema } from './annotations.js'


describe( "annotations", ( ) =>
{
	describe( "annotateCoreTypes", ( ) =>
	{
		it( "should pass without annotations", ( ) =>
		{
			const ret = annotateCoreTypes( { type: 'string' }, { } );
			expect( ret ).toStrictEqual( { type: 'string' } );
		} );

		it( "should annotate everything", ( ) =>
		{
			const ret = annotateCoreTypes(
				{ type: 'string' },
				{
					title: 'the title',
					description: 'a description\nline two\n\n@see this thing',
					default: 'Dear you',
					examples: 'Yo',
					$comment: 'private comment',
				},
			);
			expect( ret ).toStrictEqual( {
				type: 'string',
				title: 'the title',
				description: 'a description\nline two',
				see: [ 'this thing' ],
				default: 'Dear you',
				examples: 'Yo',
				comment: 'private comment',
		} );
		} );
	} );

	describe( "annotateJsonSchema", ( ) =>
	{
		it( "should pass without annotations", ( ) =>
		{
			const ret = annotateJsonSchema( { }, { type: 'string' } );
			expect( ret ).toStrictEqual( { type: 'string' } );
		} );

		it( "should annotate everything", ( ) =>
		{
			const ret = annotateJsonSchema(
				{
					title: 'the title',
					description: 'a description\nline two',
					see: [ 'this thing' ],
					default: 'Dear you',
					examples: 'Yo',
					comment: 'private comment',
				},
				{ type: 'string',
			} );
			expect( ret ).toStrictEqual( {
				type: 'string',
				title: 'the title',
				description: 'a description\nline two\n\n@see this thing',
				default: 'Dear you',
				examples: 'Yo',
				$comment: 'private comment',
			} );
		} );
	} );
} );
