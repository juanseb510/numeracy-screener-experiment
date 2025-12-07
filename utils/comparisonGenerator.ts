export type ComparisonType =
  | 'Decimal_Fraction'
  | 'Decimal_Percent'
  | 'Decimal_Decimal'
  | 'Fraction_Percent'
  | 'Fraction_Fraction'
  | 'Percent_Percent';

export type Value =
  | { type: 'fraction'; n: number; d: number }
  | { type: 'decimal'; value: number }
  | { type: 'percent'; value: number };

export function generateValue(type: Value['type']): Value {
  if (type === 'fraction') {
    return {
      type,
      n: Math.ceil(Math.random() * 9),
      d: Math.ceil(Math.random() * 9)
    };
  }

  if (type === 'decimal') {
    return {
      type,
      value: parseFloat((Math.random() * 1).toFixed(2))
    };
  }

  // percent
  return {
    type,
    value: Math.ceil(Math.random() * 100)
  };
}

export function formatValue(v: Value): string {
  if (v.type === 'fraction') return `${v.n}/${v.d}`;
  if (v.type === 'decimal') return v.value.toString();
  return `${v.value}%`;
}

export function numericValue(v: Value): number {
  if (v.type === 'fraction') return v.n / v.d;
  if (v.type === 'decimal') return v.value;
  return v.value / 100;
}

export function generateComparison(): {
  type: ComparisonType;
  left: Value;
  right: Value;
} {
  const comparisonTypes: ComparisonType[] = [
    'Decimal_Fraction',
    'Decimal_Percent',
    'Decimal_Decimal',
    'Fraction_Percent',
    'Fraction_Fraction',
    'Percent_Percent'
  ];

  const randomType =
    comparisonTypes[Math.floor(Math.random() * comparisonTypes.length)];

  let left: Value;
  let right: Value;

  switch (randomType) {
    case 'Decimal_Fraction':
      left = generateValue('decimal');
      right = generateValue('fraction');
      break;
    case 'Decimal_Percent':
      left = generateValue('decimal');
      right = generateValue('percent');
      break;
    case 'Decimal_Decimal':
      left = generateValue('decimal');
      right = generateValue('decimal');
      break;
    case 'Fraction_Percent':
      left = generateValue('fraction');
      right = generateValue('percent');
      break;
    case 'Fraction_Fraction':
      left = generateValue('fraction');
      right = generateValue('fraction');
      break;
    case 'Percent_Percent':
      left = generateValue('percent');
      right = generateValue('percent');
      break;
  }

  // Prevent equal numeric value
  while (numericValue(left) === numericValue(right)) {
    return generateComparison();
  }

  return { type: randomType, left, right };
}
