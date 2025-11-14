import { useState } from "react";
import { Server, Search, Filter, Activity, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface System {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  responseTime: number;
  lastQuery: Date;
  queriesCount: number;
  uptime: number;
  category: string;
}

interface SystemsSidebarProps {
  systems: System[];
  onSystemSelect: (systemId: string) => void;
  selectedSystemId?: string;
}

export const SystemsSidebar = ({ systems, onSystemSelect, selectedSystemId }: SystemsSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [collapsed, setCollapsed] = useState(false);

  const filteredSystems = systems.filter(system => {
    const matchesSearch = system.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || system.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'offline':
        return 'from-red-500/20 to-orange-500/20 border-red-500/30';
      case 'maintenance':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      default:
        return 'from-gray-500/20 to-gray-500/20 border-gray-500/30';
    }
  };

  if (collapsed) {
    return (
      <div className="fixed right-0 top-20 bottom-0 w-16 z-30 backdrop-blur-xl bg-gradient-to-b from-black/50 via-black/40 to-black/50 border-l border-white/10 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="w-full h-14 text-white hover:bg-white/10 rounded-none border-b border-white/10"
        >
          <Server className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-20 bottom-0 w-96 z-30 backdrop-blur-xl bg-gradient-to-b from-black/50 via-black/40 to-black/50 border-l border-white/10 transition-all duration-300 shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Sistemas</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-9 w-9 text-white hover:bg-white/10 rounded-xl"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar sistema..."
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 h-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus('all')}
            className={cn(
              "flex-1 text-xs",
              filterStatus === 'all' 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'text-white/60 hover:text-white'
            )}
          >
            Todos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus('online')}
            className={cn(
              "flex-1 text-xs",
              filterStatus === 'online' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'text-white/60 hover:text-white'
            )}
          >
            Online
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus('offline')}
            className={cn(
              "flex-1 text-xs",
              filterStatus === 'offline' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'text-white/60 hover:text-white'
            )}
          >
            Offline
          </Button>
        </div>
      </div>

      {/* Systems List */}
      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="p-4 space-y-3">
          {filteredSystems.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum sistema encontrado</p>
            </div>
          ) : (
            filteredSystems.map((system) => (
              <div
                key={system.id}
                onClick={() => onSystemSelect(system.id)}
                className={cn(
                  "group relative p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]",
                  selectedSystemId === system.id
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 shadow-lg shadow-primary/20"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary/30"
                )}
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-3">
                  <Badge className={cn("bg-gradient-to-r", getStatusColor(system.status), "text-white text-xs")}>
                    {getStatusIcon(system.status)}
                    <span className="ml-1.5 capitalize">{system.status}</span>
                  </Badge>
                  <span className="text-xs text-white/50">{system.category}</span>
                </div>

                {/* System Name */}
                <h3 className="font-semibold text-white mb-2 text-base">{system.name}</h3>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Tempo de resposta</span>
                    <span className="text-white font-medium">{system.responseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Consultas hoje</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-white font-medium">{system.queriesCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Uptime</span>
                    <span className="text-green-400 font-medium">{system.uptime}%</span>
                  </div>
                </div>

                {/* Last Query */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Activity className="h-3 w-3" />
                    <span>Último uso: {system.lastQuery.toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">{systems.filter(s => s.status === 'online').length}</div>
            <div className="text-xs text-white/50">Online</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{systems.filter(s => s.status === 'offline').length}</div>
            <div className="text-xs text-white/50">Offline</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{systems.reduce((acc, s) => acc + s.queriesCount, 0)}</div>
            <div className="text-xs text-white/50">Consultas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
