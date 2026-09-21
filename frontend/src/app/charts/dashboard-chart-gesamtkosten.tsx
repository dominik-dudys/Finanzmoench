import {type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from "@/ui-components/ui/chart.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card.tsx";
import {Area, AreaChart, CartesianGrid, XAxis} from "recharts";

export function DashboardChartGesamtkosten(){

    const chartData = [
        { month: "January", desktop: 1, mobile: 80 },
        { month: "February", desktop: 2, mobile: 200 },
        { month: "March", desktop: 3, mobile: 120 },
        { month: "April", desktop: 4, mobile: 190 },
        { month: "May", desktop: 5, mobile: 130 },
        { month: "June", desktop: 6, mobile: 140 },
        { month: "Juli", desktop: 7, mobile: 140 },
        { month: "August", desktop: 8, mobile: 140 },
        { month: "September", desktop: 9, mobile: 140 },
        { month: "Oktober", desktop: 10, mobile: 140 },
        { month: "November", desktop: 11, mobile: 140 },
        { month: "Dezember", desktop: 12, mobile: 140 },
    ]
    const chartConfig = {
        desktop: {
            label: "Laufend",
            color: "#2563eb",
        },
        mobile: {
            label: "Jährlich",
            color: "#60a5fa",
        },
    } satisfies ChartConfig

    return(

        <Card>
            <CardHeader>
                <CardTitle>Fixkostenentwicklung</CardTitle>
                <CardDescription>
                    Zeigt die Entwicklung der Fixkosten über die letzten 12 Monate
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="desktop"
                            type="natural"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>

    )
}