import {type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent} from "@/ui-components/ui/chart.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card.tsx";
import {Area, AreaChart, CartesianGrid, XAxis} from "recharts";

export interface MonthPoint {
    label: string;
    costs: number;
    income: number;
}

const chartConfig = {
    costs: {label: "Fixkosten", color: "#2563eb"},
    income: {label: "Einnahmen", color: "#16a34a"},
} satisfies ChartConfig;

interface Props {
    data: MonthPoint[];
}

export function DashboardChartGesamtkosten({data}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Verlauf</CardTitle>
                <CardDescription>Fixkosten und Einnahmen der letzten {data.length} Monate</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full sm:h-64">
                    <AreaChart accessibilityLayer data={data} margin={{left: 12, right: 12}}>
                        <CartesianGrid vertical={false}/>
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8}/>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line"/>}/>
                        <Area
                            dataKey="income"
                            type="monotone"
                            fill="var(--color-income)"
                            fillOpacity={0.15}
                            stroke="var(--color-income)"
                        />
                        <Area
                            dataKey="costs"
                            type="monotone"
                            fill="var(--color-costs)"
                            fillOpacity={0.3}
                            stroke="var(--color-costs)"
                        />
                        <ChartLegend content={<ChartLegendContent/>}/>
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}