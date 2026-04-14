interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-4 py-3">
      <span className="text-2xl">
        {streak >= 5 ? "🔥" : streak >= 2 ? "✨" : "💫"}
      </span>
      <div>
        <p className="text-sm font-medium text-orange-700">Sequência</p>
        <p className="text-2xl font-bold text-orange-600">
          {streak}{" "}
          <span className="text-sm font-normal">
            {streak === 1 ? "dia" : "dias"}
          </span>
        </p>
      </div>
    </div>
  );
}
