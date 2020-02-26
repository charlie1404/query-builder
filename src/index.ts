/* TODO: replace moment with
 * smaller lib or own impl
 * once tests are in place. */
import * as moment from 'moment';

type DateOp = 'ADD' | 'SUBTRACT' | 'CALENDAR';

type Value = string | Date;

interface RootQuery {
  id: string;
  combinator: string;
  rules: Query[];
}

// TODO: additional fields e.g. label?
interface StandardQuery {
  id: string;
  field: string;
  operator: string;
  value: Value;
  date?: DateOp;
}

interface AssociatedQuery extends StandardQuery {
  associationField: string;
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

const formatDate = (date: Date) => ` '${moment(date).format('YYYY-MM-DD')}'`;

const mapDateOp = (date: Date, dateOp: Exclude<DateOp, 'CALENDAR'>) =>
  ` (CURRENT_DATE ${DATE_OP_MAP[dateOp]} ${date})`;

const getValue = (
  type: string,
  value: Value,
  operator: string,
  dateOp?: DateOp,
) => {
  if (operator === 'is null' || operator === 'is not null') {
    return '';
  }

  switch (type) {
    case 'date': {
      if (!dateOp) {
        throw new Error(
          `No date op provided for date condition with value of ${value}`,
        );
      }

      return dateOp === 'CALENDAR'
        ? formatDate(value as Date)
        : mapDateOp(value as Date, dateOp);
    }
    // TODO: case 'small', 'medium' etc.
    case 'string': {
      return operator === 'ilike' || operator === 'not ilike'
        ? ` %${value}%`
        : ` '${value}'`;
    }
    default:
      return ` ${value}`;
  }
};

const isRootQuery = (query: Query): query is RootQuery =>
  (query as RootQuery).rules && (query as RootQuery).rules.length > 0;

const isAssociatedQuery = (query: Query): query is AssociatedQuery =>
  'associationType' in query && 'associationField' in query;

const buildWhereClause = (
  query: Query,
  fieldOptions: FieldOption[],
): string => {
  if (isRootQuery(query)) {
    return `(${query.rules
      .map(q => buildWhereClause(q, fieldOptions))
      .join(` ${query.combinator.toUpperCase()} `)})`;
  }

  if (isAssociatedQuery(query)) {
    const { associationField, associationType, ...rest } = query;
    return `${associationField} =${getValue('string', associationType, '=')} and ${buildWhereClause(rest, fieldOptions)}`
  }

  const { type } = fieldOptions.find(a => a.name === query.field) || {};

  if (!type) {
    throw new Error(
      `Corresponding field option not found for field ${query.field}`,
    );
  }

  const value = getValue(type, query.value, query.operator, query.date);

  return `${query.field} ${query.operator}${value}`;
};

export const where = (query: RootQuery, fieldOptions: FieldOption[]) =>
  query.rules.length ? `${buildWhereClause(query, fieldOptions)}` : '';
