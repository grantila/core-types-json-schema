[![npm version][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![build status][build-image]][build-url]
[![coverage status][coverage-image]][coverage-url]
[![Language grade: JavaScript][lgtm-image]][lgtm-url]
[![Node.JS version][node-version]][node-url]


# core-types-json-schema

This package provides conversion functions between [`core-types`][core-types-github-url] and JSON Schema.

*You probably don't want to use this package directly, but rather [`typeconv`][typeconv-github-url] which uses this package to convert between TypeScript, JSON Schema and GraphQL.*


# See

Other conversion packages:
 * [`core-types-ts`][core-types-ts-github-url]
 * [`core-types-graphql`][core-types-graphql-github-url]


# Usage

There are two conversion functions, `convertCoreTypesToJsonSchema` and `convertJsonSchemaToCoreTypes`, both returning a wrapped value, of the type [`ConversionResult`](https://github.com/grantila/core-types#conversion).


## core-types to JSON Schema

```ts
import { convertCoreTypesToJsonSchema } from 'core-types-json-schema'

let doc; // This core-types document comes from somewhere

const { data: jsonSchema } = convertCoreTypesToJsonSchema( doc );
```

You can provide options as a second argument on the type:

```ts
interface ConvertCoreTypesToJsonSchemaOptions
{
    sourceFilename?: string;
    filename?: string;
    userPackage?: string;
    userPackageUrl?: string;
}
```

These fields will be used when constructing a comment (`$comment`) at the root of the JSON Schema, describing the context of where the schema comes from.


## JSON Schema to core-types

```ts
import { convertJsonSchemaToCoreTypes } from 'core-types-json-schema'

let jsonSchema; // This JSON Schema comes from somewhere

const { data: doc } = convertJsonSchemaToCoreTypes( jsonSchema );
```


[npm-image]: https://img.shields.io/npm/v/core-types-json-schema.svg
[npm-url]: https://npmjs.org/package/core-types-json-schema
[downloads-image]: https://img.shields.io/npm/dm/core-types-json-schema.svg
[build-image]: https://img.shields.io/github/workflow/status/grantila/core-types-json-schema/Master.svg
[build-url]: https://github.com/grantila/core-types-json-schema/actions?query=workflow%3AMaster
[coverage-image]: https://coveralls.io/repos/github/grantila/core-types-json-schema/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/core-types-json-schema?branch=master
[lgtm-image]: https://img.shields.io/lgtm/grade/javascript/g/grantila/core-types-json-schema.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/grantila/core-types-json-schema/context:javascript
[node-version]: https://img.shields.io/node/v/core-types-json-schema
[node-url]: https://nodejs.org/en/

[typeconv-github-url]: https://github.com/grantila/typeconv
[core-types-github-url]: https://github.com/grantila/core-types
[core-types-ts-github-url]: https://github.com/grantila/core-types-ts
[core-types-graphql-github-url]: https://github.com/grantila/core-types-graphql
