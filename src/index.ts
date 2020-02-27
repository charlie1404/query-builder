type DateFormatter = (date: Date) => string;
type DateOp = 'ADD' | 'SUBTRACT' | 'CALENDAR';
type Value = string | Date;

interface RootQuery {
  id: string;
  combinator: string;
  rules?: DefinedQuery[];
}

/* Overriding rules to be non-nullable
 * if the array exists at runtime is
 * a workaround for the nature in which
 * our frontend is initially rendered */
interface DefinedRootQuery extends RootQuery {
  rules: DefinedQuery[];
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

type DefinedQuery = DefinedRootQuery | AssociatedQuery | StandardQuery;

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
        return ` Error: no date op provided for date condition with value of ${value}`;
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

const isDefinedRootQuery = (query: DefinedQuery): query is DefinedRootQuery =>
  (query as DefinedRootQuery).rules &&
  (query as DefinedRootQuery).rules.length > 0;

const isAssociatedQuery = (query: DefinedQuery): query is AssociatedQuery =>
  Boolean(
    (query as AssociatedQuery).associationType &&
      (query as AssociatedQuery).associationTypeFieldName,
  );

const hasRules = (query: RootQuery): query is DefinedRootQuery =>
  Boolean(query.rules && query.rules.length);

const buildWhereClause = (
  query: DefinedQuery,
  fieldOptions: FieldOption[],
  formatDate: DateFormatter,
): string => {
  if (isDefinedRootQuery(query)) {
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
    return `Error: corresponding field option not found for field ${query.field}`;
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
    hasRules(query)
      ? `${buildWhereClause(query, fieldOptions, formatDate)}`
      : '',
});

export default createQueryBuilder;
