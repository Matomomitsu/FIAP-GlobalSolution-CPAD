import { StyleSheet, Text, View } from "react-native";

import { Palette, Radius } from "@/constants/Colors";
import type { NumericTelemetryKey, TelemetrySnapshot } from "@/types/mission";

type TrendChartProps = {
    color: string;
    data: TelemetrySnapshot[];
    label: string;
    metric: NumericTelemetryKey;
    unit?: string;
};

export function TrendChart({
    color,
    data,
    label,
    metric,
    unit,
}: TrendChartProps) {
    const visibleData = data.slice(-16);
    const values = visibleData.map((item) => item[metric]);

    if (!values.length) {
        return (
            <View style={styles.wrapper}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.empty}>
                    Sem leituras suficientes para exibir tendencia.
                </Text>
            </View>
        );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const lastValue = values[values.length - 1] ?? 0;
    const firstValue = values[0] ?? lastValue;
    const average =
        values.reduce((total, value) => total + value, 0) / values.length;
    const delta = lastValue - firstValue;

    return (
        <View
            accessibilityLabel={`${label}. Valor atual ${lastValue}${unit ? ` ${unit}` : ""}. Media ${average.toFixed(1)}.`}
            style={styles.wrapper}
        >
            <View style={styles.header}>
                <View style={styles.headerCopy}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.range}>
                        min {min}
                        {unit ? ` ${unit}` : ""} / max {max}
                        {unit ? ` ${unit}` : ""}
                    </Text>
                </View>
                <View style={styles.currentBox}>
                    <Text style={styles.currentLabel}>Atual</Text>
                    <Text style={[styles.lastValue, { color }]}>
                        {lastValue}
                        {unit ? ` ${unit}` : ""}
                    </Text>
                </View>
            </View>

            <View style={styles.chartFrame}>
                <View style={styles.midline} />
                <View style={styles.chart}>
                    {visibleData.map((item, index) => {
                        const ratio = (item[metric] - min) / range;
                        const height = 18 + ratio * 78;
                        const isLast = index === visibleData.length - 1;

                        return (
                            <View key={item.id} style={styles.column}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height,
                                            backgroundColor: isLast
                                                ? color
                                                : Palette.track,
                                        },
                                    ]}
                                />
                                {isLast ? (
                                    <View
                                        style={[
                                            styles.lastDot,
                                            { backgroundColor: color },
                                        ]}
                                    />
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    media {average.toFixed(1)}
                    {unit ? ` ${unit}` : ""}
                </Text>
                <Text
                    style={[
                        styles.footerText,
                        { color: delta < 0 ? Palette.yellow : Palette.green },
                    ]}
                >
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(1)} tendencia
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: Palette.card,
        borderColor: Palette.border,
        borderRadius: Radius.lg,
        borderWidth: 1,
        marginTop: 16,
        padding: 15,
    },
    header: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
        marginBottom: 14,
    },
    headerCopy: {
        flex: 1,
    },
    label: {
        color: Palette.text,
        fontSize: 15,
        fontWeight: "900",
    },
    range: {
        color: Palette.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 4,
    },
    currentBox: {
        alignItems: "flex-end",
        minWidth: 86,
    },
    currentLabel: {
        color: Palette.subtle,
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 0.7,
        textTransform: "uppercase",
    },
    lastValue: {
        fontSize: 18,
        fontVariant: ["tabular-nums"],
        fontWeight: "900",
        marginTop: 2,
    },
    chartFrame: {
        backgroundColor: Palette.cardMuted,
        borderColor: Palette.border,
        borderRadius: Radius.md,
        borderWidth: 1,
        height: 124,
        justifyContent: "flex-end",
        overflow: "hidden",
        padding: 10,
    },
    midline: {
        backgroundColor: Palette.border,
        height: 1,
        left: 10,
        position: "absolute",
        right: 10,
        top: "52%",
    },
    chart: {
        alignItems: "flex-end",
        flexDirection: "row",
        gap: 5,
        height: "100%",
    },
    column: {
        alignItems: "center",
        flex: 1,
        height: "100%",
        justifyContent: "flex-end",
    },
    bar: {
        borderRadius: 999,
        minHeight: 12,
        opacity: 0.95,
        width: "100%",
    },
    lastDot: {
        borderRadius: 999,
        height: 6,
        marginTop: 5,
        width: 6,
    },
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },
    footerText: {
        color: Palette.subtle,
        fontSize: 11,
        fontWeight: "900",
        textTransform: "uppercase",
    },
    empty: {
        color: Palette.muted,
        fontSize: 14,
        lineHeight: 21,
        marginTop: 8,
    },
});
