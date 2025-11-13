import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Database, DollarSign, Package, Calculator, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

export type SystemStatus = "online" | "teste" | "depreciado";
export type SystemCategory = "Estoque" | "Financeiro" | "ERP Fábrica" | "Calculadoras" | "Integração";

export interface System {
  id: string;
  name: string;
  slug: string;
  category: SystemCategory;
  status: SystemStatus;
  description: string;
}

interface SystemCardProps {
  system: System;
  isSelected: boolean;
  onClick: () => void;
}

const categoryIcons: Record<SystemCategory, any> = {
  "Estoque": Package,
  "Financeiro": DollarSign,
  "ERP Fábrica": Database,
  "Calculadoras": Calculator,
  "Integração": Workflow,
};

const statusConfig: Record<SystemStatus, { variant: "default" | "secondary" | "destructive", label: string }> = {
  online: { variant: "default", label: "Online" },
  teste: { variant: "secondary", label: "Em testes" },
  depreciado: { variant: "destructive", label: "Depreciado" },
};

export const SystemCard = ({ system, isSelected, onClick }: SystemCardProps) => {
  const Icon = categoryIcons[system.category];
  const statusInfo = statusConfig[system.status];
  
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-lg border-2",
        isSelected 
          ? "border-primary shadow-[0_0_20px_rgba(0,150,255,0.3)] bg-card" 
          : "border-transparent hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{system.name}</h3>
            <Badge variant="outline" className="text-xs mt-1">
              {system.category}
            </Badge>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {system.description}
      </p>
      
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    </Card>
  );
};
