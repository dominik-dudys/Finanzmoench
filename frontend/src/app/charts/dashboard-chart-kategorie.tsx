import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/ui-components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend, ChartLegendContent, ChartTooltip,
    ChartTooltipContent
} from "@/ui-components/ui/chart.tsx";
import {Pie, PieChart} from "recharts";


export const description = "A donut chart with text"
const chartData = [
    { browser: "chrome", visitors: 275, fill: "#2563eb" },
    { browser: "safari", visitors: 200, fill: "#16a34a" },
    { browser: "firefox", visitors: 287, fill: "#f59e0b" },
    { browser: "edge", visitors: 173, fill: "#ef4444" },
    { browser: "other", visitors: 190, fill: "#8b5cf6" },
]
const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    chrome: {
        label: "Safari",
    },
    safari: {
        label: "test",
    },
    firefox: {
        label: "Firefox",
    },
    edge: {
        label: "Edge",
    },
    other: {
        label: "Other",
    },
} satisfies ChartConfig

export function DashboardChartKategorie(){


    return(
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Pie Chart - Legend</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-75"
                >
                    <PieChart>
                        <ChartTooltip
                            content={<ChartTooltipContent nameKey="browser" hideLabel />}
                        />
                        <Pie data={chartData} dataKey="visitors" />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="browser" />}
                            className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                        />
                    </PieChart>

                </ChartContainer>
            </CardContent>
        </Card>

    )
}