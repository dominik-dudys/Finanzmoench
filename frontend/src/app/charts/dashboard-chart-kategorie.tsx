import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {
    type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent,
} from "@/ui-components/ui/chart.tsx";
import {Label, Pie, PieChart} from "recharts";
import {formatMoney} from "@/features/costs/format";
import type {CostCategoryStats} from "@/features/dashboard/api";

interface Props {
    categories: CostCategoryStats[];
    total: number;
}

export function DashboardChartKategorie({categories, total}: Props) {
    const data = categories.map((c) => ({
        key: c.category_id,
        value: Number(c.total_amount),
        fill: c.color_code,
    }));
    const config: ChartConfig = Object.fromEntries(
        categories.map((c) => [c.category_id, {label: c.name, color: c.color_code}]),
    );

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Nach Kategorie</CardTitle>
                <CardDescription>Fixkosten pro Monat</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Kosten in diesem Monat.</p>
                ) : (
                    <ChartContainer config={config} className="mx-auto aspect-square max-h-80">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel/>}/>
                            <Pie data={data} dataKey="value" nameKey="key" innerRadius={60} strokeWidth={4}>
                                <Label
                                    content={({viewBox}) => {
                                        if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-lg font-semibold">
                                                    {formatMoney(total)}
                                                </tspan>
                                                <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                                                    pro Monat
                                                </tspan>
                                            </text>
                                        );
                                    }}
                                />
                            </Pie>
                            <ChartLegend
                                content={<ChartLegendContent nameKey="key"/>}
                                className="flex-wrap gap-2 *:justify-center"
                            />
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}