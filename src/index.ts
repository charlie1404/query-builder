/* TODO: replace moment with
 * smaller lib or own impl
 * once tests are in place. */
import * as moment from 'moment';

type DateOp = 'ADD' | 'SUBTRACT' | 'CALENDAR';

interface RootQuery {
  id: string;
  combinator: string;
  rules: Query[]
}

// TODO: additional fields e.g. label?
interface Query {
  id: string;
  field: string;
  operator: string;
  value: string;
  date?: DateOp;
}

/* TODO: additional options
 * for assoc. fields */
interface FieldOption {
  name: string;
  type: string;
}

const DATE_OP_MAP = {
  ADD: '+',
  SUBTRACT: '-',
};

const formatDate = (date: string) => ` '${moment(date).format('YYYY-MM-DD')}'`;

const mapDateOp = (date: string, dateOp: Exclude<DateOp, 'CALENDAR'>) => ` (CURRENT_DATE ${DATE_OP_MAP[dateOp]} ${date})`;

const getValue = (type: string, value: string, operator: string, dateOp?: DateOp) => {
  if (operator === 'is null' || operator === 'is not null') {
    return '';
  }

  switch (type) {
    case 'date': {
      if (!dateOp) {
        throw new Error(`No date op provided for date condition with value of ${value}`);
      }

      return dateOp === 'CALENDAR' ? formatDate(value) : mapDateOp(value, dateOp);
    }
    case 'string': {
      return (operator === 'ilike' || operator === 'not ilike') ? ` %${value}%` : ` '${value}'`;
    }
    default:
      return ` ${value}`;
  }
};

const isRootQuery = (query: RootQuery | Query): query is RootQuery =>
  (query as RootQuery).rules && (query as RootQuery).rules.length > 0;

const buildWhereClause = (query: RootQuery | Query, fieldOptions: FieldOption[]): string => {
  if (isRootQuery(query)) {
    return `(${query.rules.map(q => buildWhereClause(q, fieldOptions)).join(` ${query.combinator.toUpperCase()} `)})`;
  }

  const { type } = fieldOptions.find(a => a.name === query.field) || {};

  if (!type) {
    throw new Error(`Corresponding field option not found for field ${query.field}`);
  }

  const value = getValue(type, query.value, query.operator, query.date);

  return `${query.field} ${query.operator}${value}`;
};

export const where = (query: RootQuery, fieldOptions: FieldOption[]) => query.rules && query.rules.length
  ? `${buildWhereClause(query, fieldOptions)}`
  : '';
