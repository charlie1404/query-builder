/* TODO: replace moment with
 * smaller lib or own impl
 * once tests are in place. */
import moment from 'moment';

interface Query {
  field: string;
  operator: string;
  value: string | number;
  combinator: string;
  rules: Query[];
  date?: string;
}

/* TODO: additional options
 * for assoc. fields */
interface FieldOption {
  name: string;
  type: string;
}

// TODO: refine types
const getValue = (type: string, value: string | number, operator: string, date?: string) => {
  // TODO: define this once
  const dateMap = { ADD: '+', SUBTRACT: '-' };

  if (operator === 'is null' || operator === 'is not null') {
    return '';
  }

  switch (type) {
    case 'date': {
      const formattedDate = ` '${moment(value).format('YYYY-MM-DD')}'`;
      const dateOperation = ` (CURRENT_DATE ${dateMap[date]} ${value})`;
      return date === 'CALENDAR' ? formattedDate : dateOperation;
    }
    case 'string': {
      return (operator === 'ilike' || operator === 'not ilike') ? ` %${value}%` : ` '${value}'`;
    }
    default:
      return ` ${value}`;
  }
};

const buildWhereClause = (query: Query, fieldOptions: FieldOption[]) => {
  if (query.rules && query.rules.length) {
    return `(${query.rules.map(q => buildWhereClause(q, fieldOptions)).join(` ${query.combinator.toUpperCase()} `)})`;
  }

  const { type } = fieldOptions.find(a => a.name === query.field);
  const value = getValue(type, query.value, query.operator, query.date);

  return `${query.field} ${query.operator}${value}`;
};

export const where = (query: Query, fieldOptions: FieldOption[]) => query.rules && query.rules.length
  ? `${buildWhereClause(query, fieldOptions)}`
  : '';
