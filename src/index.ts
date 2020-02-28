type DateFormatter = (date: Date) => string;
type DateOp = 'ADD' | 'SUBTRACT' | 'CALENDAR';
type Value = string | Date;

export enum Mode {
  Display, // for building strings that are rendered on the frontend
  Validation, // for validating complete queries, throwing an error when incomplete
}

interface BuilderOptions {
  dateFormatter: DateFormatter;
  mode?: Mode;
}

const defaultOptions = {
  mode: Mode.Validation,
};

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

const handleMissingValue = ({ mode }: BuilderOptions, reason: string, displayFallback = '') => {
  if (mode === Mode.Validation) {
    throw new Error(reason);
  }

  return displayFallback;
};

const mapDateOp = (date: Date, dateOp: Exclude<DateOp, 'CALENDAR'>) =>
  ` (CURRENT_DATE ${DATE_OP_MAP[dateOp]} ${date})`;

const getValue = (
  type: string,
  value: Value,
  operator: string,
  { dateFormatter }: BuilderOptions,
  dateOp?: DateOp,
) => {
  if (operator === 'is null' || operator === 'is not null') {
    return '';
  }

  switch (type) {
    case 'date':
      if (!dateOp) {
        throw new Error(`No date op provided for date condition with value of ${value}`);
      }

      return dateOp === 'CALENDAR'
        ? ` '${dateFormatter(value as Date)}'`
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
  builderOptions: BuilderOptions,
): string => {
  if (isDefinedRootQuery(query)) {
    return `(${query.rules
      .map(q => buildWhereClause(q, fieldOptions, builderOptions))
      .join(` ${query.combinator.toUpperCase()} `)})`;
  }

  if (isAssociatedQuery(query)) {
    const { associationTypeFieldName, associationType, ...innerQuery } = query;
    return `${associationTypeFieldName} =${getValue(
      'string',
      associationType,
      '=',
      builderOptions,
    )} and ${buildWhereClause(innerQuery, fieldOptions, builderOptions)}`;
  }

  const { type } = fieldOptions.find(a => a.name === query.field) || {};

  if (!type) {
    throw new Error(`Corresponding field option not found for field ${query.field}`);
  }

  const value = getValue(
    type,
    query.value,
    query.operator,
    builderOptions,
    query.date,
  );

  return `${query.field} ${query.operator}${value}`;
};

const createQueryBuilder = (userOptions: BuilderOptions) => {
  const options = {
    ...defaultOptions,
    ...userOptions,
  };

  return {
    where: (query: RootQuery, fieldOptions: FieldOption[]) => {
      if (!hasRules(query)) {
        return handleMissingValue(options, 'Root query has no rules', '()');
      }

      return `${buildWhereClause(query, fieldOptions, options)}`;
    }
  };
};

export default createQueryBuilder;
