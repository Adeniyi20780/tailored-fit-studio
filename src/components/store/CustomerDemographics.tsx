import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CustomerDemographicsProps {
  data: { category: string; count: number }[];
  isLoading: boolean;
}

const CustomerDemographics = ({ data, isLoading }: CustomerDemographicsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Demographics</CardTitle>
        <CardDescription>Orders by product category</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No customer data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value, "Orders"]}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerDemographics;
