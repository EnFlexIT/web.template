import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Modal,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";

import {
  StyleSheet,
  useUnistyles,
} from "react-native-unistyles";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import {
  Icon,
} from "./Icon/Icon";

//**************************************************************************** */

type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DatePickerProps = {
  label?: string;

  /**
   * ISO date:
   * YYYY-MM-DD
   */
  value: string;

  onChange: (
    value: string,
  ) => void;

  disabled?: boolean;

  locale?: string;

  placeholder?: string;

  minDate?: string;
  maxDate?: string;

  style?: StyleProp<ViewStyle>;
};

//**************************************************************************** */

function padNumber(
  value: number,
): string {
  return String(
    value,
  ).padStart(
    2,
    "0",
  );
}

//**************************************************************************** */

function formatDateValue(
  year: number,
  month: number,
  day: number,
): string {
  return [
    year,
    padNumber(
      month + 1,
    ),
    padNumber(day),
  ].join("-");
}

//**************************************************************************** */

function parseDateValue(
  value: string,
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]) - 1;

  const day =
    Number(match[3]);

  const date =
    new Date(
      year,
      month,
      day,
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return date;
}

//**************************************************************************** */

function getInitialMonth(
  value: string,
): Date {
  const selected =
    parseDateValue(
      value,
    );

  const source =
    selected ??
    new Date();

  return new Date(
    source.getFullYear(),
    source.getMonth(),
    1,
  );
}

//**************************************************************************** */

export function DatePicker({
  label,
  value,
  onChange,
  disabled = false,
  locale = "en-US",
  placeholder = "YYYY-MM-DD",
  minDate,
  maxDate,
  style,
}: DatePickerProps) {
  const { theme } =
    useUnistyles();

  const {
    width: screenWidth,
    height: screenHeight,
  } =
    useWindowDimensions();

  const anchorRef =
    useRef<View>(null);

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    anchor,
    setAnchor,
  ] =
    useState<
      AnchorRect | null
    >(null);

  const [
    visibleMonth,
    setVisibleMonth,
  ] =
    useState<Date>(
      () =>
        getInitialMonth(
          value,
        ),
    );

  /*
   * Keep the calendar month synchronized when
   * the value is changed from outside.
   */
  useEffect(() => {
    if (!value) {
      return;
    }

    const selected =
      parseDateValue(
        value,
      );

    if (!selected) {
      return;
    }

    setVisibleMonth(
      new Date(
        selected.getFullYear(),
        selected.getMonth(),
        1,
      ),
    );
  }, [value]);

  const close =
    useCallback(() => {
      setOpen(false);
    }, []);

  const measureAndOpen =
    useCallback(() => {
      if (disabled) {
        return;
      }

      if (open) {
        close();
        return;
      }

      const selected =
        parseDateValue(
          value,
        );

      if (selected) {
        setVisibleMonth(
          new Date(
            selected.getFullYear(),
            selected.getMonth(),
            1,
          ),
        );
      }

      requestAnimationFrame(
        () => {
          if (
            !anchorRef.current
          ) {
            setOpen(true);
            return;
          }

          anchorRef.current
            .measureInWindow(
              (
                x: number,
                y: number,
                width: number,
                height: number,
              ) => {
                setAnchor({
                  x,
                  y,
                  width,
                  height,
                });

                setOpen(true);
              },
            );
        },
      );
    }, [
      close,
      disabled,
      open,
      value,
    ]);

  const selectedDate =
    useMemo(
      () =>
        parseDateValue(
          value,
        ),
      [value],
    );

  const displayValue =
    useMemo(() => {
      if (!selectedDate) {
        return "";
      }

      return new Intl.DateTimeFormat(
        locale,
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      ).format(
        selectedDate,
      );
    }, [
      locale,
      selectedDate,
    ]);

  const monthLabel =
    useMemo(
      () =>
        new Intl.DateTimeFormat(
          locale,
          {
            month: "long",
            year: "numeric",
          },
        ).format(
          visibleMonth,
        ),
      [
        locale,
        visibleMonth,
      ],
    );

  const weekdayLabels =
    useMemo(
      () =>
        Array.from(
          {
            length: 7,
          },
          (
            _,
            index,
          ) => {
            /*
             * 01.01.2024 was a Monday.
             * This gives us a Monday-first calendar.
             */
            const date =
              new Date(
                2024,
                0,
                1 + index,
              );

            return new Intl.DateTimeFormat(
              locale,
              {
                weekday:
                  "short",
              },
            ).format(
              date,
            );
          },
        ),
      [locale],
    );

  const year =
    visibleMonth
      .getFullYear();

  const month =
    visibleMonth
      .getMonth();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0,
    ).getDate();

  const firstDay =
    new Date(
      year,
      month,
      1,
    ).getDay();

  /*
   * JavaScript:
   * Sunday = 0
   *
   * Calendar:
   * Monday = 0
   */
  const firstDayOffset =
    (firstDay + 6) % 7;

  const calendarDays =
    useMemo(
      () =>
        Array.from(
          {
            length: 42,
          },
          (
            _,
            index,
          ) => {
            const day =
              index -
              firstDayOffset +
              1;

            if (
              day < 1 ||
              day >
                daysInMonth
            ) {
              return null;
            }

            return day;
          },
        ),
      [
        daysInMonth,
        firstDayOffset,
      ],
    );

  const todayValue =
    useMemo(() => {
      const today =
        new Date();

      return formatDateValue(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
    }, []);

  const calendarStyle =
    useMemo(() => {
      if (!anchor) {
        return null;
      }

      const gap = 8;

      const popupWidth =
        Math.min(
          340,
          screenWidth - 16,
        );

      /*
       * Approximate popup height used only for
       * deciding whether the calendar should open
       * above or below the field.
       */
      const popupHeight =
        390;

      let left =
        anchor.x;

      let top =
        anchor.y +
        anchor.height +
        gap;

      if (
        left +
          popupWidth >
        screenWidth - 8
      ) {
        left =
          Math.max(
            8,
            screenWidth -
              popupWidth -
              8,
          );
      }

      if (left < 8) {
        left = 8;
      }

      if (
        top +
          popupHeight >
        screenHeight - 8
      ) {
        top =
          Math.max(
            8,
            anchor.y -
              popupHeight -
              gap,
          );
      }

      return {
        position:
          "absolute" as const,

        left,
        top,

        width:
          popupWidth,

        zIndex: 9999,
      };
    }, [
      anchor,
      screenHeight,
      screenWidth,
    ]);

  function previousMonth() {
    setVisibleMonth(
      new Date(
        year,
        month - 1,
        1,
      ),
    );
  }

  function nextMonth() {
    setVisibleMonth(
      new Date(
        year,
        month + 1,
        1,
      ),
    );
  }

  function selectDay(
    day: number,
  ) {
    const newValue =
      formatDateValue(
        year,
        month,
        day,
      );

    if (
      minDate &&
      newValue < minDate
    ) {
      return;
    }

    if (
      maxDate &&
      newValue > maxDate
    ) {
      return;
    }

    onChange(
      newValue,
    );

    close();
  }

  function isDisabledDate(
    dateValue: string,
  ): boolean {
    if (
      minDate &&
      dateValue < minDate
    ) {
      return true;
    }

    if (
      maxDate &&
      dateValue > maxDate
    ) {
      return true;
    }

    return false;
  }

  return (
    <View
      style={[
        styles.wrapper,
        style,
      ]}
    >
      {label ? (
        <ThemedText
          style={
            styles.label
          }
        >
          {label}
        </ThemedText>
      ) : null}

      <Pressable
        ref={anchorRef}
        collapsable={
          false
        }
        disabled={
          disabled
        }
        accessibilityRole="button"
        onPress={
          measureAndOpen
        }
        style={({
          pressed,
        }) => [
          styles.field,

          {
            borderColor:
              theme.colors
                .border,

            backgroundColor:
              theme.colors
                .card,

            opacity:
              disabled
                ? 0.55
                : pressed
                  ? 0.8
                  : 1,
          },
        ]}
      >
        <ThemedText
          numberOfLines={1}
          style={[
            styles.value,

            !displayValue &&
              styles.placeholder,
          ]}
        >
          {displayValue ||
            placeholder}
        </ThemedText>

        <Icon
          name="calendar"
          size={18}
          color={
            theme.colors.text
          }
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={
          close
        }
      >
        <Pressable
          style={
            styles.backdrop
          }
          onPress={
            close
          }
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.calendar,

              calendarStyle,

              {
                borderColor:
                  theme.colors
                    .border,

                backgroundColor:
                  theme.colors
                    .card,
              },
            ]}
          >
            <View
              style={
                styles.calendarHeader
              }
            >
              <Pressable
                accessibilityRole="button"
                onPress={
                  previousMonth
                }
                style={({
                  pressed,
                }) => [
                  styles.navigationButton,

                  {
                    borderColor:
                      theme.colors
                        .border,

                    backgroundColor:
                      pressed
                        ? theme.colors
                            .background
                        : "transparent",
                  },
                ]}
              >
                <Icon
                  name="left"
                  size={16}
                  color={
                    theme.colors
                      .text
                  }
                />
              </Pressable>

              <ThemedText
                style={
                  styles.monthLabel
                }
              >
                {monthLabel}
              </ThemedText>

              <Pressable
                accessibilityRole="button"
                onPress={
                  nextMonth
                }
                style={({
                  pressed,
                }) => [
                  styles.navigationButton,

                  {
                    borderColor:
                      theme.colors
                        .border,

                    backgroundColor:
                      pressed
                        ? theme.colors
                            .background
                        : "transparent",
                  },
                ]}
              >
                <Icon
                  name="right"
                  size={16}
                  color={
                    theme.colors
                      .text
                  }
                />
              </Pressable>
            </View>

            <View
              style={
                styles.weekdays
              }
            >
              {weekdayLabels.map(
                (
                  weekday,
                  index,
                ) => (
                  <View
                    key={`${weekday}-${index}`}
                    style={
                      styles.weekdayCell
                    }
                  >
                    <ThemedText
                      style={
                        styles.weekdayText
                      }
                    >
                      {weekday}
                    </ThemedText>
                  </View>
                ),
              )}
            </View>

            <View
              style={
                styles.daysGrid
              }
            >
              {calendarDays.map(
                (
                  day,
                  index,
                ) => {
                  if (
                    day ===
                    null
                  ) {
                    return (
                      <View
                        key={`empty-${index}`}
                        style={
                          styles.dayCell
                        }
                      />
                    );
                  }

                  const dateValue =
                    formatDateValue(
                      year,
                      month,
                      day,
                    );

                  const selected =
                    dateValue ===
                    value;

                  const today =
                    dateValue ===
                    todayValue;

                  const dateDisabled =
                    isDisabledDate(
                      dateValue,
                    );

                  return (
                    <View
                      key={
                        dateValue
                      }
                      style={
                        styles.dayCell
                      }
                    >
                      <Pressable
                        accessibilityRole="button"
                        disabled={
                          dateDisabled
                        }
                        onPress={() =>
                          selectDay(
                            day,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.dayButton,

                          today &&
                            !selected && {
                              borderColor:
                                theme
                                  .colors
                                  .text,
                            },

                          selected && {
                            borderColor:
                              theme
                                .colors
                                .text,

                            backgroundColor:
                              theme
                                .colors
                                .text,
                          },

                          pressed &&
                            !selected && {
                              backgroundColor:
                                theme
                                  .colors
                                  .background,
                            },

                          dateDisabled &&
                            styles.dayDisabled,
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.dayText,

                            selected && {
                              color:
                                theme
                                  .colors
                                  .card,

                              fontWeight:
                                "700",
                            },
                          ]}
                        >
                          {day}
                        </ThemedText>
                      </Pressable>
                    </View>
                  );
                },
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

//**************************************************************************** */

const styles =
  StyleSheet.create(() => ({
    wrapper: {
      minWidth: 220,
      gap: 6,
    },

    label: {
      fontSize: 13,
      fontWeight: "600",
    },

    field: {
      minHeight: 42,

      paddingHorizontal: 12,

      borderWidth: 1,
      borderRadius: 6,

      flexDirection: "row",
      alignItems: "center",

      gap: 12,
    },

    value: {
      flex: 1,
      fontSize: 14,
    },

    placeholder: {
      opacity: 0.5,
    },

    backdrop: {
      flex: 1,

      backgroundColor:
        "rgba(0,0,0,0.14)",

      zIndex: 9998,
    },

    calendar: {
      borderWidth: 1,
      borderRadius: 8,

      padding: 14,

      elevation: 8,

      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 3,
      },
    },

    calendarHeader: {
      minHeight: 40,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 8,

      marginBottom: 12,
    },

    navigationButton: {
      width: 34,
      height: 34,

      borderWidth: 1,
      borderRadius: 5,

      alignItems: "center",
      justifyContent:
        "center",
    },

    monthLabel: {
      flex: 1,

      textAlign: "center",

      fontSize: 15,
      fontWeight: "700",
    },

    weekdays: {
      flexDirection: "row",

      marginBottom: 4,
    },

    weekdayCell: {
      width: "14.285714%",

      minHeight: 28,

      alignItems: "center",
      justifyContent:
        "center",
    },

    weekdayText: {
      fontSize: 11,
      fontWeight: "600",

      opacity: 0.55,
    },

    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    dayCell: {
      width: "14.285714%",

      aspectRatio: 1,

      padding: 2,
    },

    dayButton: {
      flex: 1,

      borderWidth: 1,
      borderColor:
        "transparent",

      borderRadius: 5,

      alignItems: "center",
      justifyContent:
        "center",
    },

    dayDisabled: {
      opacity: 0.3,
    },

    dayText: {
      fontSize: 13,
    },
  }));