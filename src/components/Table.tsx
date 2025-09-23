import { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// export const table: ReactNode[][] = 

interface FieldProps {
    atRightEdge: boolean,
    atBottomEdge: boolean
}
function Field({ children, atBottomEdge, atRightEdge }: PropsWithChildren<FieldProps>) {

    styles.useVariants({
        atBottomEdge: atBottomEdge,
        atRightEdge: atRightEdge
    })

    return (
        <View
            style={[styles.field, styles.closeBorderToBottom, styles.closeBorderToRight]}
        >
            {children}
        </View>
    )
}

interface TableProps {
    data: ReactNode[][]
}
export function Table(props: TableProps) {
    return (
        <View>
            {
                props.data.map((row, i) => (
                    <View
                        key={i}
                        style={[styles.row]}
                    >
                        {
                            row.map((element, j) => (
                                <Field
                                    atRightEdge={j === row.length - 1}
                                    atBottomEdge={i === props.data.length - 1}
                                >
                                    {element}
                                </Field>
                            ))
                        }
                    </View>
                ))
            }
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    row: {
        flexDirection: "row"
    },
    field: {
        flex: 1,
        padding: 5,
        borderColor: theme.colors.border,
        borderLeftWidth: 1,
        borderTopWidth: 1,
    },
    closeBorderToRight: {
        variants: {
            atRightEdge: {
                true: {
                    borderRightWidth: 1,
                }
            }
        }
    },
    closeBorderToBottom: {
        variants: {
            atBottomEdge: {
                true: {
                    borderBottomWidth: 1,
                }
            }
        }
    }
}))
