type DateFormatter = (date: Date) => string;
type DateOp = 'ADD' | 'SUBTRACT' | 'CALENDAR';
type Value = string | boolean | number | Date | null;

export enum Mode {
  Display, // for building strings that are rendered on the frontend
  Validation, // for validating complete queries, throwing an error when incomplete
}

interface FieldMetadata {
  associationTypeFieldName: string;
  associationRankFieldName: string;
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

/* Most of the fields are optional
 * as unpopulated rules can be created
 * on the frontend, for which we must
 * build some sort of output string */
interface StandardQuery {
  id: string;
  field?: string;
  operator?: string;
  value?: Value;
  date?: DateOp;
}

interface AssociatedQuery extends StandardQuery {
  associationType: string;
  associationRank?: string;
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

const handleMissingValue = (
  { mode }: BuilderOptions,
  reason: string,
  displayFallback?: string,
) => {
  if (mode === Mode.Validation) {
    throw new Error(reason);
  }

  return displayFallback;
};

const validateQuery = (
  query: StandardQuery,
  options: BuilderOptions,
): StandardQuery => ({
  id: query.id,
  field:
    query.field ||
    handleMissingValue(options, `No field for query ${query.id}`),
  operator:
    query.operator ||
    handleMissingValue(options, `No operator for query ${query.id}`),
  value: query.value, // validated by getValue
  date: query.date,
});

const mapDateOp = (date: Date, dateOp: Exclude<DateOp, 'CALENDAR'>) =>
  `(CURRENT_DATE ${DATE_OP_MAP[dateOp]} ${date})`;

const getValue = (
  options: BuilderOptions,
  { field, operator, value, date: dateOp }: StandardQuery,
  type = '',
) => {
  if (operator === 'is null' || operator === 'is not null') {
    return undefined;
  }

  if (
    (typeof value === 'string' && value.trim() === '') ||
    value === undefined ||
    value === null
  ) {
    return handleMissingValue(options, `Missing value for field ${field}`);
  }

  switch (type) {
    case 'date':
      if (!dateOp) {
        return handleMissingValue(
          options,
          `No date op provided for date condition with value of ${value}`,
        );
      }

      return dateOp === 'CALENDAR'
        ? `'${options.dateFormatter(value as Date)}'`
        : mapDateOp(value as Date, dateOp);

    case 'string':
    case 'small':
    case 'medium':
    case 'large':
      return operator === 'ilike' || operator === 'not ilike'
        ? `%${value}%`
        : `'${value}'`;
    default:
      return value;
  }
};

const isDefinedRootQuery = (query: DefinedQuery): query is DefinedRootQuery =>
  (query as DefinedRootQuery).rules &&
  (query as DefinedRootQuery).rules.length > 0;

const isAssociatedQuery = (query: DefinedQuery): query is AssociatedQuery =>
  Boolean((query as AssociatedQuery).associationType);

const hasRules = (query: RootQuery): query is DefinedRootQuery =>
  Boolean(query.rules && query.rules.length);

const includeAssocationRank = (
  { associationRankFieldName }: FieldMetadata,
  associationRank?: string,
) => associationRankFieldName && associationRank && associationRank !== 'all';

const buildAssociativeQuery = (
  query: AssociatedQuery,
  fieldOptions: FieldOption[],
  fieldMetadata: FieldMetadata,
  builderOptions: BuilderOptions,
) => {
  const { associationType, associationRank, ...innerQuery } = query;

  const valueClause = buildWhereClause(
    innerQuery,
    fieldOptions,
    fieldMetadata,
    builderOptions,
  );

  const rankClause = includeAssocationRank(fieldMetadata, associationRank)
    ? `${fieldMetadata.associationRankFieldName} = ${associationRank}`
    : '';

  return [
    `${fieldMetadata.associationTypeFieldName} = '${associationType}'`,
    rankClause,
    valueClause,
  ]
    .filter(Boolean)
    .join(' and ');
};

const buildWhereClause = (
  query: DefinedQuery,
  fieldOptions: FieldOption[],
  fieldMetadata: FieldMetadata,
  builderOptions: BuilderOptions,
): string => {
  if (isDefinedRootQuery(query)) {
    return `(${query.rules
      .map(q =>
        buildWhereClause(q, fieldOptions, fieldMetadata, builderOptions),
      )
      .join(` ${query.combinator.toUpperCase()} `)})`;
  }

  if (isAssociatedQuery(query)) {
    return buildAssociativeQuery(
      query,
      fieldOptions,
      fieldMetadata,
      builderOptions,
    );
  }

  const validatedQuery = validateQuery(query, builderOptions);

  const {
    type = handleMissingValue(
      builderOptions,
      `Corresponding field option not found for field ${query.field}`,
    ),
  } = fieldOptions.find(a => a.name === validatedQuery.field) || {};

  const value = getValue(builderOptions, validatedQuery, type);

  return [validatedQuery.field, validatedQuery.operator, value]
    .filter(p => p !== undefined)
    .join(' ');
};

const createQueryBuilder = (userOptions: BuilderOptions) => {
  const options = {
    ...defaultOptions,
    ...userOptions,
  };

  return {
    where: (
      query: RootQuery,
      fieldOptions: FieldOption[],
      fieldMetadata: FieldMetadata,
    ) => {
      if (!hasRules(query)) {
        return handleMissingValue(options, 'Root query has no rules', '()');
      }

      return buildWhereClause(query, fieldOptions, fieldMetadata, options);
    },
  };
};

export default createQueryBuilder;
