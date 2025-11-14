import { Moon, Sun, Wifi, WifiOff, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import nexusHubLogo from "@/assets/nexushub-logo.png";
import { StatusPanel } from "@/components/StatusPanel";

interface HeaderProps {
  isDark: boolean;
  onThemeToggle: () => void;
  isConnected: boolean;
  onLogout?: () => void;
  totalSystems?: number;
  onlineSystems?: number;
  lastUpdate?: Date;
}

export const Header = ({ isDark, onThemeToggle, isConnected, onLogout, totalSystems = 0, onlineSystems = 0, lastUpdate = new Date() }: HeaderProps) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-r from-black/40 via-black/30 to-black/40 border-b border-white/10 shadow-2xl">
      {/* Linha única com badges centralizados */}
      <div className="flex h-16 items-center justify-between px-8 border-b border-white/5 relative">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse" />
            <img src={nexusHubLogo} alt="NexusHub" className="h-12 w-12 relative z-10 transition-transform group-hover:scale-110 duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent">
              NexusHub
            </h1>
            <p className="text-xs text-white/70 tracking-wider uppercase font-medium">
              Central Inteligente de Sistemas
            </p>
          </div>
        </div>
        
        {/* Badges de status centralizados na barra */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <StatusPanel 
            totalSystems={totalSystems}
            onlineSystems={onlineSystems}
            lastUpdate={lastUpdate}
          />
        </div>

        <div className="flex items-center gap-5">
          {user.fullName && (
            <div className="text-right px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <p className="text-sm text-white font-semibold">{user.fullName}</p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
          )}
          
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
              isConnected 
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400 shadow-lg shadow-green-500/20' 
                : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400 shadow-lg shadow-red-500/20'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 animate-pulse" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                Offline
              </>
            )}
          </Badge>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="h-11 w-11 rounded-xl hover:bg-gradient-to-br hover:from-primary/20 hover:to-primary/10 text-white border border-white/10 hover:border-primary/30 transition-all duration-300 hover:scale-105"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {user.role === 'admin' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/users')}
              className="h-11 w-11 rounded-xl hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-blue-600/10 text-white border border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:scale-105"
              title="Gerenciar Usuários"
            >
              <Users className="h-5 w-5" />
            </Button>
          )}

          {onLogout && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="h-11 w-11 rounded-xl hover:bg-gradient-to-br hover:from-red-500/20 hover:to-red-600/10 text-white border border-white/10 hover:border-red-400/30 transition-all duration-300 hover:scale-105"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
