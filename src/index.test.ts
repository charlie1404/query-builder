import { where } from './';

describe('Query Builder', () => {
  describe('where()', () => {
    it('should concatenate field names, operators, and values into an SQL where clause', () => {
      const fieldOptions = [
        {
          name: 'predltv',
          type: 'smallint'
        },
        {
          name: 'ordercount',
          type: 'integer'
        }
      ];

      const query = {
        id: '1',
        combinator: 'and',
        rules: [
          {
            id: '1',
            value:'2000',
            field: 'predltv',
            operator: '=',
          },
          {
            id: '2',
            value:'5',
            field: 'ordercount',
            operator: '>',
          }
        ],
      };

      const expectedClause = '(predltv = 2000 AND ordercount > 5)';

      expect(where(query, fieldOptions)).toBe(expectedClause);
    });

    it.todo('should wrap string values in SQL wildcards when the operator is `ilike`');
    it.todo('should wrap string values in SQL wildcards when the operator is `not ilike`');
    it.todo('should wrap string values in SQL wildcards when the operator is `not ilike`');
    it.todo('should format the value as a date when when the type is `date` and the date operator is `CALENDAR`');
    it.todo('should compute a date add operation when the date operator is `ADD`');
    it.todo('should compute a date subtract operation when the date operator is `SUBTRACT`');
    it.todo('should build associative clauses when the query has associationType and associationField properties');
    it.todo('should throw an error when there isn`t a field option for a given query type');
    it.todo('should throw an error for a date query when the date op isn`t provided');
  });
});
