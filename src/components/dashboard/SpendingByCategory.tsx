import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { SpendingByCategory as SpendingData } from "@/hooks/useCustomerAnalytics";

interface SpendingByCategoryProps {
  data: SpendingData[];
  isLoading: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--terracotta))",
  "hsl(var(--success))",
  "hsl(var(--muted-foreground))",
];

const SpendingByCategory = ({ data, isLoading }: SpendingByCategoryProps) => {
  const chartData = data.map((item) => ({
    name: item.category,
    value: item.amount,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Where you've invested in your wardrobe</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No purchases yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `$${value.toFixed(2)} (${props.payload.count} orders)`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingByCategory;
