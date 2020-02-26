/* TODO: replace moment with
 * smaller lib or own impl
 * once tests are in place. */
import * as moment from 'moment';

type DateOp = 'ADD' | 'SUBTRACT' | 'CALENDAR';

interface Query {
  field: string;
  operator: string;
  value: string;
  combinator: string;
  rules: Query[];
  dateOp?: DateOp;
}

/* TODO: additional options
 * for assoc. fields */
interface FieldOption {
  name: string;
  type: string;
}

const DATE_OP_MAP = {
  ADD: '+',
  SUBTRACT: '-'
};

const formatDate = (date: string) => ` '${moment(date).format('YYYY-MM-DD')}'`;

const mapDateOp = (date: string, dateOp: Exclude<DateOp, 'CALENDAR'>) => ` (CURRENT_DATE ${DATE_OP_MAP[dateOp]} ${date})`;

// TODO: refine types
const getValue = (type: string, value: string, operator: string, dateOp?: DateOp) => {
  // TODO: define this once

  if (operator === 'is null' || operator === 'is not null') {
    return '';
  }

  switch (type) {
    case 'date': {
      if (!dateOp) {
        throw new Error();
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

const buildWhereClause = (query: Query, fieldOptions: FieldOption[]): string => {
  if (query.rules && query.rules.length) {
    return `(${query.rules.map(q => buildWhereClause(q, fieldOptions)).join(` ${query.combinator.toUpperCase()} `)})`;
  }

  const { type } = fieldOptions.find(a => a.name === query.field) || {};

  if (!type) {
    throw new Error(`Corresponding field option not found for field ${query.field}`);
  }

  const value = getValue(type, query.value, query.operator, query.dateOp);

  return `${query.field} ${query.operator}${value}`;
};

export const where = (query: Query, fieldOptions: FieldOption[]) => query.rules && query.rules.length
  ? `${buildWhereClause(query, fieldOptions)}`
  : '';
