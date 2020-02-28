# Query Builder

Validate AIS-conformant query trees and serialise them as SQL strings.

```ts
import createQueryBuilder from '@peak-ai/query-builder';
import * as moment from 'moment';

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

console.log(queryBuilder.where(query, fieldOptions));
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
const { default: createQueryBuilder } = require('@peak-ai/query-builder');
```

## API

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
* `yarn format:check`: verifies that the source code adheres to our Prettier configuration
* `yarn format:write`: fixes and overwrites any source files that _don't_ adhere to our Prettier config
* `yarn build`: runs the TypeScript compiler against the project and produces distributable output
* `yarn test`: runs the unit tests

## Contributing
