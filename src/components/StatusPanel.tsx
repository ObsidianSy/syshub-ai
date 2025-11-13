import { Activity, Database, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="glass-effect border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/60 mb-1">Total de Sistemas</p>
            <p className="text-2xl font-bold text-white">{totalSystems}</p>
          </div>
          <Database className="h-8 w-8 text-primary/70" />
        </div>
      </Card>

      <Card className="glass-effect border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/60 mb-1">Status Online</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-green-400">{onlineSystems}</p>
              <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/30 text-green-400">
                {onlinePercentage}%
              </Badge>
            </div>
          </div>
          <Activity className="h-8 w-8 text-green-400/70" />
        </div>
      </Card>

      <Card className="glass-effect border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/60 mb-1">Offline / Manutenção</p>
            <p className="text-2xl font-bold text-orange-400">{offlineCount}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-orange-400/70" />
        </div>
      </Card>

      <Card className="glass-effect border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/60 mb-1">Última Atualização</p>
            <p className="text-sm font-medium text-white">
              {lastUpdate.toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs text-white/50">
              {lastUpdate.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <Clock className="h-8 w-8 text-primary/70" />
        </div>
      </Card>
    </div>
  );
};
