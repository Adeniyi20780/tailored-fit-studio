import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface OrderCompletionRateProps {
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  isLoading: boolean;
}

const OrderCompletionRate = ({
  completed,
  inProgress,
  pending,
  cancelled,
  isLoading,
}: OrderCompletionRateProps) => {
  const total = completed + inProgress + pending + cancelled;
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

  const data = [
    { name: "Completed", value: completed, color: "hsl(142, 76%, 36%)" },
    { name: "In Progress", value: inProgress, color: "hsl(217, 91%, 60%)" },
    { name: "Pending", value: pending, color: "hsl(45, 93%, 47%)" },
    { name: "Cancelled", value: cancelled, color: "hsl(0, 84%, 60%)" },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Completion Rate</CardTitle>
        <CardDescription>Overview of order statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : total === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No orders yet
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCompletionRate;
