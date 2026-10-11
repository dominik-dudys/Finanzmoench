import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from "@/ui-components/ui/chart.tsx";
import {Label, Pie, PieChart} from "recharts";
import {formatMoney} from "@/features/costs/format";
import type {CostCategoryStats} from "@/features/dashboard/api";

interface Props {
    categories: CostCategoryStats[];
    total: number;
}

export function DashboardChartKategorie({categories, total}: Props) {
    const sorted = [...categories].sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
    const data = sorted.map((c) => ({
        key: c.category_id,
        value: Number(c.total_amount),
        fill: c.color_code,
    }));
    const config: ChartConfig = Object.fromEntries(
        sorted.map((c) => [c.category_id, {label: c.name, color: c.color_code}]),
    );

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Nach Kategorie</CardTitle>
                <CardDescription>Fixkosten pro Monat</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 pb-4">
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Kosten in diesem Monat.</p>
                ) : (
                    <>
                        <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-64">
                            <PieChart>
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            nameKey="key"
                                            hideLabel
                                            formatter={(value, name, item) => (
                                                <div className="flex w-full items-center gap-2">
                                                <span className="size-2.5 shrink-0 rounded-xs" style={{backgroundColor: item.payload?.fill}}/>
                                                    <span className="text-muted-foreground">{config[String(name)]?.label ?? name}</span>
                                                    <span className="ml-auto pl-4 font-medium tabular-nums text-foreground">
                                                        {formatMoney(Number(value))}
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Pie data={data} dataKey="value" nameKey="key" innerRadius="62%" strokeWidth={4}>
                                    <Label
                                        content={({viewBox}) => {
                                            if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                                            const cx = viewBox.cx ?? 0;
                                            const cy = viewBox.cy ?? 0;
                                            return (
                                                <text x={cx} y={cy} textAnchor="middle">
                                                    <tspan x={cx} y={cy - 4} className="fill-foreground text-lg font-semibold">
                                                        {formatMoney(total)}
                                                    </tspan>
                                                    <tspan x={cx} y={cy + 16} className="fill-muted-foreground text-xs">
                                                        pro Monat
                                                    </tspan>
                                                </text>
                                            );
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>

                        {/* Eigene Legende mit Beträgen */}
                        <ul className="flex flex-col gap-2 text-sm">
                            {sorted.map((c) => (
                                <li key={c.category_id} className="flex items-center gap-2">
                                    <span className="size-2.5 shrink-0 rounded-full" style={{backgroundColor: c.color_code}} aria-hidden/>
                                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                                    <span className="text-muted-foreground">{Number(c.percentage_of_costs).toFixed(0)} %</span>
                                    <span className="w-24 shrink-0 text-right font-medium">{formatMoney(c.total_amount)}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </CardContent>
        </Card>
    );
}