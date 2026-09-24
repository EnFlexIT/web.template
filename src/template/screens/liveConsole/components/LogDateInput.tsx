import React from "react";

import {
  useTranslation,
} from "react-i18next";

import {
  DatePicker,
} from "@/template/components/design-system/ui-elements/DatePicker";

type LogDateInputProps = {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (
    value: string,
  ) => void;
};

export function LogDateInput({
  label,
  value,
  disabled = false,
  onChange,
}: LogDateInputProps) {
  const {
    i18n,
  } = useTranslation();

  const locale =
    i18n.language
      ?.toLowerCase()
      .startsWith("de")
      ? "de-DE"
      : "en-US";

  return (
    <DatePicker
      label={label}
      value={value}
      disabled={disabled}
      locale={locale}
      onChange={onChange}
    />
  );
}