interface PointsBarProps {
  points: number;
  level: number;
}

export function PointsBar({ points, level }: PointsBarProps) {
  const pointsInLevel = points % 100;
  const progress = pointsInLevel;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">
          {points} <span className="text-gray-400 font-normal">pontos totais</span>
        </span>
        <span className="text-gray-500">Nível {level}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">
        {100 - pointsInLevel} pts para o próximo nível
      </p>
    </div>
  );
}
