import { Moon, Sun, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  isDark: boolean;
  onThemeToggle: () => void;
  isConnected: boolean;
}

export const Header = ({ isDark, onThemeToggle, isConnected }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Central de Sistemas
          </h1>
          <p className="text-xs text-white/60">
            Hub de documentação conectado ao agente de IA
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-2 bg-white/10 border-white/20 text-white"
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="rounded-full hover:bg-white/10 text-white"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
