"use client";

interface StreakDotsProps {
  attendanceDates: string[];
  streak: number;
}

function getMotivationalMessage(streak: number): string {
  if (streak === 0) return "Vamos começar hoje! 💪";
  if (streak <= 4) return `Continue assim! ${streak} dia${streak > 1 ? "s" : ""} seguido${streak > 1 ? "s" : ""}`;
  if (streak <= 9) return `Você está em chamas! 🔥 ${streak} dias`;
  return `Lendário! ${streak} dias sem parar! ⚡`;
}

export default function StreakDots({ attendanceDates, streak }: StreakDotsProps) {
  const presentSet = new Set(attendanceDates);

  const dots = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const isPresent = presentSet.has(dateStr);
    const dayIndex = i + 1;
    const isBonus = isPresent && dayIndex % 5 === 0;
    return { dateStr, isPresent, isBonus };
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        {dots.map(({ dateStr, isPresent, isBonus }, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isBonus
                  ? "bg-orange-400 text-white shadow-md"
                  : isPresent
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
              title={dateStr}
            >
              {isBonus ? "🔥" : isPresent ? "✓" : ""}
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-600 font-medium">
        {getMotivationalMessage(streak)}
      </p>
    </div>
  );
}
