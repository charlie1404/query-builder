import * as moment from 'moment';
import createQueryBuilder from './';

describe('Query Builder', () => {
  const formatDate = (date: Date) => ` '${moment(date).format('YYYY-MM-DD')}'`;
  const queryBuilder = createQueryBuilder(formatDate);

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

    it('should build associative clauses when the query has associationType and associationField properties', () => {
      const fieldOptions = [
        {
          name: 'associationvalue',
          type: 'small',
          label: 'Brand',
          autocomplete: true,
          associationType: 'Brand',
          associatedField: 'associationvalue',
        },
      ];

      const query = {
        id: '1',
        combinator: 'and',
        rules: [
          {
            associationTypeFieldName: 'associationtype', // TODO: tweak in segment explorer!
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

    it('should return an empty string if there are no rules on the root query', () => {
      const query = {
        id: '1',
        combinator: 'or',
        rules: [],
      };

      expect(queryBuilder.where(query, [])).toBe('');
    });
  });
});
