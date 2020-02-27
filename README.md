# Query Builder

Builds SQL query strings from AIS-conformant query and filter field objects.

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

const formatDate = (date: Date) => moment(date).format('YYYY-MM-DD');
const queryBuilder = createQueryBuilder(formatDate);

console.log(queryBuilder.where(query, fieldOptions));
// => `(useremail = 'joebloggs@gmail.com' AND (ordercount > 20 OR customergender = 'male'))`
```

## Getting started

## API

## Local development

## Contributing
