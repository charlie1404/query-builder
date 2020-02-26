import { where } from './';

describe('Query Builder', () => {
  describe('where()', () => {
    it.todo('should concatenate field names, operators, and values into an SQL where clause');
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
