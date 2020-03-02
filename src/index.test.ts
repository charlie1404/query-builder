import * as moment from 'moment';
import createQueryBuilder, { Mode } from './';

describe('Query Builder', () => {
  const dateFormatter = (date: Date) => moment(date).format('YYYY-MM-DD');

  const fieldMetadata = {
    associationTypeFieldName: 'associationtype',
    associationRankFieldName: 'associationrank',
  };

  describe('Mode = Validation', () => {
    // Validation is the default mode
    const queryBuilder = createQueryBuilder({
      dateFormatter,
      fieldMetadata,
    });

    describe('where()', () => {
      it('should concatenate field names, operators, and values into an SQL where clause', () => {
        const fieldOptions = [
          {
            name: 'predltv',
            type: 'smallint',
          },
          {
            name: 'ordercount',
            type: 'integer',
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              id: '1',
              value: '2000',
              field: 'predltv',
              operator: '=',
            },
            {
              id: '2',
              value: '5',
              field: 'ordercount',
              operator: '>',
            },
          ],
        };

        const expectedClause = '(predltv = 2000 AND ordercount > 5)';

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should wrap string values in SQL wildcards when the operator is `ilike`', () => {
        const fieldOptions = [
          {
            name: 'useremail',
            type: 'string',
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              id: '1',
              value: 'joebloggs',
              field: 'useremail',
              operator: 'ilike',
            },
          ],
        };

        const expectedClause = '(useremail ilike %joebloggs%)';

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should wrap string values in SQL wildcards when the operator is `not ilike`', () => {
        const fieldOptions = [
          {
            name: 'useremail',
            type: 'string',
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              id: '1',
              value: 'joebloggs',
              field: 'useremail',
              operator: 'not ilike',
            },
          ],
        };

        const expectedClause = '(useremail not ilike %joebloggs%)';

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should format the value as a date when when the type is `date` and the date operator is `CALENDAR`', () => {
        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              value: new Date(1582735631000),
              field: 'dob',
              operator: '=',
              date: 'CALENDAR' as const,
            },
          ],
        };

        const expectedClause = `(dob = '2020-02-26')`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should compute a date add operation when the date operator is `ADD`', () => {
        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              value: 'run date',
              field: 'dob',
              operator: '=',
              date: 'ADD' as const,
            },
          ],
        };

        const expectedClause = `(dob = (CURRENT_DATE + run date))`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should compute a date subtract operation when the date operator is `SUBTRACT`', () => {
        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              value: 'run date',
              field: 'dob',
              operator: '=',
              date: 'SUBTRACT' as const,
            },
          ],
        };

        const expectedClause = `(dob = (CURRENT_DATE - run date))`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should support different date formatters', () => {
        const gbFormatter = (date: Date) => moment(date).format('DD/MM/YYYY');

        const gbBuilder = createQueryBuilder({
          dateFormatter: gbFormatter,
          fieldMetadata,
        });

        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              value: new Date(1582735631000),
              field: 'dob',
              operator: '=',
              date: 'CALENDAR' as const,
            },
          ],
        };

        const expectedClause = `(dob = '26/02/2020')`;

        expect(gbBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should build associative clauses when the query has associationType and associationField properties', () => {
        const fieldOptions = [
          {
            name: 'associationvalue',
            type: 'small',
            label: 'Brand',
            autocomplete: true,
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              associationType: 'Brand',
              field: 'associationvalue',
              id: '1',
              operator: '=',
              value: 'Nike',
            },
          ],
        };

        const expectedClause = `(associationtype = 'Brand' and associationvalue = 'Nike')`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should include the association rank field when present in an associative query', () => {
        const fieldOptions = [
          {
            name: 'associationvalue',
            type: 'small',
            label: 'Brand',
            autocomplete: true,
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              associationType: 'Brand',
              associationRank: '2',
              field: 'associationvalue',
              id: '1',
              operator: '=',
              value: 'Nike',
            },
          ],
        };

        const expectedClause = `(associationtype = 'Brand' and associationrank = 2 and associationvalue = 'Nike')`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      /* This test is required as GraphQL will resolve
       * optional fields to `null` when the underlying
       * items don't have values for them. */
      it('should treat rules regularly when the association props are present but null', () => {
        const fieldOptions = [
          {
            name: 'brand',
            type: 'small',
            label: 'Brand',
            autocomplete: true,
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              associationType: null,
              field: 'brand',
              id: '1',
              operator: '=',
              value: 'Nike',
            },
          ],
        };

        const expectedClause = `(brand = 'Nike')`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should support nested rule groups', () => {
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

        const expectedClause = `(useremail = 'joebloggs@gmail.com' AND (ordercount > 20 OR customergender = 'male'))`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should throw an error when there isn`t a field option for a given query type', () => {
        const fieldOptions = [
          {
            name: 'Foo',
            type: 'string',
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              id: '1',
              value: 'joebloggs',
              field: 'useremail',
              operator: 'not ilike',
            },
          ],
        };

        expect(() => queryBuilder.where(query, fieldOptions)).toThrow(
          new Error('Corresponding field option not found for field useremail'),
        );
      });

      it('should throw an error for a date query when the date op isn`t provided', () => {
        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              value: 'run date',
              field: 'dob',
              operator: '=',
            },
          ],
        };

        expect(() => queryBuilder.where(query, fieldOptions)).toThrow(
          new Error(
            'No date op provided for date condition with value of run date',
          ),
        );
      });

      it('should throw an error if there are no rules on the root query', () => {
        const query = {
          id: '1',
          combinator: 'or',
          rules: [],
        };

        expect(() => queryBuilder.where(query, [])).toThrow(
          new Error('Root query has no rules'),
        );
      });

      /* Required as query passed via props
       * doesn't have an initial default */
      it('should throw an error if top-level rules array is undefined', () => {
        const query = {
          id: '1',
          combinator: 'or',
        };

        expect(() => queryBuilder.where(query, [])).toThrow(
          new Error('Root query has no rules'),
        );
      });
    });
  });

  describe('Mode = Display', () => {
    const queryBuilder = createQueryBuilder({
      dateFormatter,
      mode: Mode.Display,
      fieldMetadata,
    });

    describe('where()', () => {
      it('should return an empty pair of parens when rules are not defined', () => {
        const query = {
          id: '1',
          combinator: 'or',
        };

        expect(queryBuilder.where(query, [])).toBe('()');
      });

      it('should return an empty pair of parens when rules are empty', () => {
        const query = {
          id: '1',
          combinator: 'or',
          rules: [],
        };

        expect(queryBuilder.where(query, [])).toBe('()');
      });

      it('should render empty parens if there`s a rule with no values', () => {
        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
            },
          ],
        };

        expect(queryBuilder.where(query, [])).toBe('()');
      });

      it('should only render the field if the operator and value are missing', () => {
        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              field: 'dob',
            },
          ],
        };

        const expectedClause = '(dob)';

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should only render the operator if the field and value are missing', () => {
        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              operator: '=',
            },
          ],
        };

        const expectedClause = '(=)';

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should render the value verbatim if there isn`t a field option for the given rule', () => {
        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              id: '1',
              value: '1',
              field: 'ordercount',
              operator: '=',
            },
          ],
        };

        const expectedClause = '(ordercount = 1)';

        expect(queryBuilder.where(query, [])).toBe(expectedClause);
      });

      it('should only render the value if the field and operator are missing', () => {
        const fieldOptions = [
          {
            name: 'dob',
            type: 'date',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              value: '10',
            },
          ],
        };

        const expectedClause = '(10)';

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should only render the field and operator if the value is missing', () => {
        const fieldOptions = [
          {
            name: 'useremail',
            type: 'medium',
          },
        ];

        const query = {
          id: '1',
          combinator: 'or',
          rules: [
            {
              id: '1',
              field: 'useremail',
              operator: '=',
            },
          ],
        };

        const expectedClause = `(useremail =)`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should only render the association type clause if the subsequent value clauses is empty', () => {
        const fieldOptions = [
          {
            name: 'associationvalue',
            type: 'small',
            label: 'Brand',
            autocomplete: true,
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              associationType: 'Brand',
              id: '1',
            },
          ],
        };

        const expectedClause = `(associationtype = 'Brand')`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });

      it('should only render the association type clause and field if the other parts are missing', () => {
        const fieldOptions = [
          {
            name: 'associationvalue',
            type: 'small',
            label: 'Brand',
            autocomplete: true,
          },
        ];

        const query = {
          id: '1',
          combinator: 'and',
          rules: [
            {
              associationType: 'Brand',
              id: '1',
              field: 'associationvalue',
            },
          ],
        };

        const expectedClause = `(associationtype = 'Brand' and associationvalue)`;

        expect(queryBuilder.where(query, fieldOptions)).toBe(expectedClause);
      });
    });
  });
});
