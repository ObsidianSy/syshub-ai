import { Activity, Database, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusPanelProps {
  totalSystems: number;
  onlineSystems: number;
  lastUpdate: Date;
}

export const StatusPanel = ({ totalSystems, onlineSystems, lastUpdate }: StatusPanelProps) => {
  const offlineCount = totalSystems - onlineSystems;
  const onlinePercentage = Math.round((onlineSystems / totalSystems) * 100);

  return (
    <div className="flex items-center gap-6 px-4">
      {/* Total de Sistemas */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Database className="h-4 w-4 text-blue-400" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-white/60 font-medium">Total:</span>
          <span className="text-sm font-bold text-white">{totalSystems}</span>
        </div>
      </div>

      {/* Status Online */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
        <Activity className="h-4 w-4 text-green-400" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-white/60 font-medium">Online:</span>
          <span className="text-sm font-bold text-green-400">{onlineSystems}</span>
          <Badge variant="outline" className="text-[10px] bg-green-500/20 border-green-500/30 text-green-400 px-1.5 py-0 h-4">
            {onlinePercentage}%
          </Badge>
        </div>
      </div>

      {/* Offline */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <TrendingUp className="h-4 w-4 text-orange-400" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-white/60 font-medium">Offline:</span>
          <span className="text-sm font-bold text-orange-400">{offlineCount}</span>
        </div>
      </div>

      {/* Última Atualização */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <Clock className="h-4 w-4 text-purple-400" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-white/60 font-medium">Atualizado:</span>
          <span className="text-xs font-medium text-white">
            {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
