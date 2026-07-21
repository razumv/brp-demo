export function normalizeDealerSearch(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

export function formatDealerDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

export function ukrainianCount(value: number, forms: readonly [string, string, string]) {
  const remainder100 = value % 100;
  const remainder10 = value % 10;
  if (remainder100 >= 11 && remainder100 <= 14) return `${value} ${forms[2]}`;
  if (remainder10 === 1) return `${value} ${forms[0]}`;
  if (remainder10 >= 2 && remainder10 <= 4) return `${value} ${forms[1]}`;
  return `${value} ${forms[2]}`;
}
