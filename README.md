# Query Builder

![Build status](https://github.com/peak-ai/query-builder/workflows/Build/badge.svg)

Validate AIS-conformant query trees and serialise them as SQL strings.

```ts
import createQueryBuilder from '@peak-ai/query-builder';
import * as moment from 'moment';

const fieldMetadata = {
  associationTypeFieldName: 'associationtype',
  associationRankFieldName: 'associationrank',
};

const fieldOptions = [
  {
    name: 'useremail',
    type: 'large',
  },
  {
    name: 'ordercount',
    type: 'integer',
  },
  {
    name: 'customergender',
    type: 'small',
  },
];

const query = {
  id: '1',
  combinator: 'and',
  rules: [
    {
      id: '1',
      field: 'useremail',
      value: 'joebloggs@gmail.com',
      operator: '=',
    },
    {
      id: '2',
      combinator: 'or',
      rules: [
        {
          id: '2',
          field: 'ordercount',
          value: '20',
          operator: '>',
        },
        {
          id: '3',
          field: 'customergender',
          value: 'male',
          operator: '=',
        },
      ],
    },
  ],
};

const dateFormatter = (date: Date) => moment(date).format('YYYY-MM-DD');
const queryBuilder = createQueryBuilder({ dateFormatter });

console.log(queryBuilder.where(query, fieldOptions, fieldMetadata));
// => `(useremail = 'joebloggs@gmail.com' AND (ordercount > 20 OR customergender = 'male'))`
```

## Getting started

You can install Query Builder from npm:

```sh
npm i -E @peak-ai/query-builder
```

The library comprises of a factory function, exposed via a `default` binding, as well as an additional binding for the `Mode` enum:

```ts
import createQueryBuilder, { Mode } from '@peak-ai/query-builder';
```

If you're using CommonJS, this means you'll have to destructure and rename the `default` binding:

```ts
const { default: createQueryBuilder, Mode } = require('@peak-ai/query-builder');
```

## API

### `createQueryBuilder(options: BuilderOptions)`

```ts
const queryBuilder = createQueryBuilder({
  dateFormatter: (date: Date) => moment(date).format('YYYY-MM-DD'),
  mode: Mode.Display,
});
```

Creates a query builder API surface for the given options.

#### Arguments

* `options: BuilderOptions`: an object containing:
  * `dateFormatter: (date: Date) => string`: a function for converting dates to strings, the return value of which is used directly by the query builder
  * `mode: Mode` (optional, defaulting to `Mode.Validation`): determines how the query builder should handle invalid query trees (missing values, no top-level rules etc.):
    * `Mode.Display`: doesn't throw when the tree is deemed invalid, instead rendering fallback values within the rendered SQL strings
    * `Mode.Validation`: explicitly throws an error when the query tree is deemed invalid

#### Returns

`QueryBuilder`: a query builder API surface

### `QueryBuilder#where(query: RootQuery, fieldOptions: FieldOption[], fieldMetadata: FieldMetadata)`

```ts
queryBuilder.where(query, fieldOptions, fieldMetadata);
```

Builds, optionally validates, and returns an SQL string for the given query tree, intended to be used in an SQL `WHERE` clause.

#### Arguments

* `query: RootQuery`: a tree representing your SQL query. See the example at the beginning of the README
* `fieldOptions: FieldOption[]`: an array of objects containing the names and data types of all the possible fields that can be queried. See the example at the beginning of the README
* `fieldMetadata: FieldMetadata`: an object containing the column names of association fields:
  * `associationTypeFieldName: string`: the column name of the association type field
  * `associationRankFieldName: string`: the column name of the association rank field

#### Returns

`string`: an SQL-compliant `WHERE` clause

## Local development

Prerequisites:

* [Node Version Manager](https://github.com/nvm-sh/nvm)
* [Yarn v1](https://yarnpkg.com/getting-started/install)

1. Fork this repo
2. `git clone <your fork>`
3. `cd query-builder`
4. `nvm i`
5. `yarn`

You can then run:

* `yarn lint`: runs ESLint against the source code
* `yarn format`: fixes and overwrites any source files that _don't_ adhere to our Prettier config
* `yarn build`: runs the TypeScript compiler against the project and produces distributable output
* `yarn test`: runs the unit tests
* `yarn test:dist`: runs the compiled unit tests against the compiled source. Typically used by our pre-commit hook, CI, and pre-publish script

## Contributing

Given this library is rather specific to our commercial requirements, we can't accept any contributions that change the _behaviour_ of the library. However, any contributions that may improve the underlying implementation (e.g. maintainability, performance etc.) will be considered given the test suite continues to pass. Please see the [contribution guidelines](https://github.com/peak-ai/query-builder/blob/master/CONTRIBUTING.md) for more info.
