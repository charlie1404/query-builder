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
  });
});
