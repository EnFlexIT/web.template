export function formatUpdateTimestamp(
  value: string | number | null | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  const normalizedValue =
    String(value).trim();

  const numericTimestamp =
    Number(normalizedValue);

  const date =
    Number.isFinite(numericTimestamp)
      ? new Date(numericTimestamp)
      : new Date(normalizedValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}