import CircularProgress from "@/components/ui/CircularProgress";
import { Goal, GoalType } from "@/types";

const GOAL_LABELS: Record<GoalType, string> = {
  weekly_trainings: "Treinos na semana",
  monthly_trainings: "Treinos no mês",
  streak_target: "Meta de streak",
};

const GOAL_COLORS: Record<GoalType, string> = {
  weekly_trainings: "#3b82f6",
  monthly_trainings: "#8b5cf6",
  streak_target: "#f97316",
};

function formatPeriod(period: string): string {
  if (period.includes("-W")) {
    const [year, week] = period.split("-W");
    return `Semana ${week}, ${year}`;
  }
  const [year, month] = period.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const progress = Math.round((goal.current / Math.max(goal.target, 1)) * 100);
  const color = goal.completed ? "#22c55e" : GOAL_COLORS[goal.type as GoalType] || "#3b82f6";

  return (
    <div
      className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${
        goal.completed ? "border-green-200" : "border-gray-200"
      }`}
    >
      <CircularProgress
        value={goal.completed ? 100 : progress}
        size={72}
        strokeWidth={7}
        color={color}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">
          {GOAL_LABELS[goal.type as GoalType] || goal.type}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{formatPeriod(goal.period)}</p>
        <p className="text-sm text-gray-700 mt-1">
          {goal.current} / {goal.target}{" "}
          <span className="text-gray-400 text-xs">
            {goal.type === "streak_target" ? "dias" : "treinos"}
          </span>
        </p>
        {goal.completed && (
          <p className="text-xs text-green-600 font-semibold mt-1">✓ Meta atingida!</p>
        )}
      </div>
    </div>
  );
}
