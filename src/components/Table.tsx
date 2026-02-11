import React, { PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface FieldProps {
  atRightEdge: boolean;
  atBottomEdge: boolean;
  atFirstRow: boolean;
  atFirstColumn: boolean;
  flex?: number; 
}

function Field({
  children,
  atBottomEdge,
  atRightEdge,
  atFirstRow,
  atFirstColumn,
  flex = 1,
}: PropsWithChildren<FieldProps>) {
  styles.useVariants({
    atBottomEdge,
    atRightEdge,
    atFirstRow,
    atFirstColumn,
  });

  return (
    <View
      style={[
        styles.field,
        { flex }, 
        styles.borderRight,
        styles.borderBottom,
        styles.borderTop,
        styles.borderLeft,
      ]}
    >
      {children}
    </View>
  );
}

interface TableProps {
  data: ReactNode[][];
  columnFlex?: number[]; 
}

export function Table({ data, columnFlex }: TableProps) {
  return (
    <View>
      {data.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((element, j) => (
            <Field
              key={`${i}-${j}`}
              flex={columnFlex?.[j] ?? 1} 
              atRightEdge={j === row.length - 1}
              atBottomEdge={i === data.length - 1}
              atFirstRow={i === 0}
              atFirstColumn={j === 0}
            >
              {element}
            </Field>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
  },

 
  field: {
    padding: 10,
    borderColor: theme.colors.border,
  },

 
  borderRight: {
    variants: {
      atRightEdge: {
        true: { borderRightWidth: 1 },
        false: { borderRightWidth: 1 },
      },
    },
  },
  borderBottom: {
    variants: {
      atBottomEdge: {
        true: { borderBottomWidth: 1 },
        false: { borderBottomWidth: 1 },
      },
    },
  },

 
  borderTop: {
    variants: {
      atFirstRow: {
        true: { borderTopWidth: 1 },
      },
    },
  },

  
  borderLeft: {
    variants: {
      atFirstColumn: {
        true: { borderLeftWidth: 1 },
      },
    },
  },
}));
