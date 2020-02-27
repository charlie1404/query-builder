type DateFormatter = (date: Date) => string;
type DateOp = 'ADD' | 'SUBTRACT' | 'CALENDAR';
type Value = string | Date;

interface RootQuery {
  id: string;
  combinator: string;
  rules: Query[];
}

interface StandardQuery {
  id: string;
  field: string;
  operator: string;
  value: Value;
  date?: DateOp;
}

interface AssociatedQuery extends StandardQuery {
  associationTypeFieldName: string;
  associationType: string;
}

type Query = RootQuery | AssociatedQuery | StandardQuery;

interface FieldOption {
  name: string;
  type: string;
}

const DATE_OP_MAP = {
  ADD: '+',
  SUBTRACT: '-',
};

const mapDateOp = (date: Date, dateOp: Exclude<DateOp, 'CALENDAR'>) =>
  ` (CURRENT_DATE ${DATE_OP_MAP[dateOp]} ${date})`;

const getValue = (
  type: string,
  value: Value,
  operator: string,
  formatDate: DateFormatter,
  dateOp?: DateOp,
) => {
  if (operator === 'is null' || operator === 'is not null') {
    return '';
  }

  switch (type) {
    case 'date':
      if (!dateOp) {
        throw new Error(
          `No date op provided for date condition with value of ${value}`,
        );
      }

      return dateOp === 'CALENDAR'
        ? ` '${formatDate(value as Date)}'`
        : mapDateOp(value as Date, dateOp);

    case 'string':
    case 'small':
    case 'medium':
    case 'large':
      return operator === 'ilike' || operator === 'not ilike'
        ? ` %${value}%`
        : ` '${value}'`;
    default:
      return ` ${value}`;
  }
};

const isRootQuery = (query: Query): query is RootQuery =>
  (query as RootQuery).rules && (query as RootQuery).rules.length > 0;

const isAssociatedQuery = (query: Query): query is AssociatedQuery =>
  'associationType' in query && 'associationTypeFieldName' in query;

const buildWhereClause = (
  query: Query,
  fieldOptions: FieldOption[],
  formatDate: DateFormatter,
): string => {
  if (isRootQuery(query)) {
    return `(${query.rules
      .map(q => buildWhereClause(q, fieldOptions, formatDate))
      .join(` ${query.combinator.toUpperCase()} `)})`;
  }

  if (isAssociatedQuery(query)) {
    const { associationTypeFieldName, associationType, ...innerQuery } = query;
    return `${associationTypeFieldName} =${getValue(
      'string',
      associationType,
      '=',
      formatDate,
    )} and ${buildWhereClause(innerQuery, fieldOptions, formatDate)}`;
  }

  const { type } = fieldOptions.find(a => a.name === query.field) || {};

  if (!type) {
    throw new Error(
      `Corresponding field option not found for field ${query.field}`,
    );
  }

  const value = getValue(
    type,
    query.value,
    query.operator,
    formatDate,
    query.date,
  );

  return `${query.field} ${query.operator}${value}`;
};

const createQueryBuilder = (formatDate: DateFormatter) => ({
  where: (query: RootQuery, fieldOptions: FieldOption[]) =>
    query.rules.length
      ? `${buildWhereClause(query, fieldOptions, formatDate)}`
      : '',
});

export default createQueryBuilder;
