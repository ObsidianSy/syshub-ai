import { useState } from "react";
import { Star, Clock, ChevronRight, Trash2, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface Project {
  id: string;
  name: string;
  description: string;
  context: string;
  createdAt: Date;
}

export interface HistoryItem {
  id: string;
  systemName: string;
  question: string;
  summary: string;
  timestamp: Date;
  isFavorite: boolean;
  projectId?: string;
}

interface QueryHistoryProps {
  items: HistoryItem[];
  projects: Project[];
  currentProjectId?: string;
  onItemClick: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateProject: (name: string, description: string, context: string) => void;
  onSelectProject: (projectId: string | null) => void;
  onDeleteProject: (projectId: string) => void;
  selectedId?: string;
}

export const QueryHistory = ({ 
  items, 
  projects,
  currentProjectId,
  onItemClick, 
  onToggleFavorite, 
  onDelete, 
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  selectedId 
}: QueryHistoryProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectContext, setNewProjectContext] = useState("");

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName, newProjectDescription, newProjectContext);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectContext("");
      setDialogOpen(false);
    }
  };

  // Filtrar itens do projeto atual
  const filteredItems = currentProjectId 
    ? items.filter(item => item.projectId === currentProjectId)
    : items.filter(item => !item.projectId); // Itens sem projeto (geral)

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return (
    <div 
      className={cn(
        "fixed left-0 top-20 bottom-0 z-40 backdrop-blur-xl bg-gradient-to-b from-black/50 via-black/40 to-black/50 border-r border-white/10 transition-all duration-300 shadow-2xl",
        collapsed ? "w-16" : "w-96"
      )}
    >
      <div className="flex flex-col border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-center justify-between p-5">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-white">Projetos</h2>
              <p className="text-xs text-white/50">Organize suas conversas</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-white/10 h-10 w-10 rounded-xl border border-white/10 hover:border-primary/30 transition-all duration-300"
          >
            <ChevronRight className={cn("h-5 w-5 transition-transform duration-300", !collapsed && "rotate-180")} />
          </Button>
        </div>

        {!collapsed && (
          <div className="px-4 pb-5 space-y-3">
            {/* Botão Geral (sem projeto) */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-white hover:bg-white/10 rounded-xl p-4 h-auto transition-all duration-300 border",
                !currentProjectId 
                  ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 shadow-lg shadow-primary/20" 
                  : "border-white/10 hover:border-primary/30"
              )}
              onClick={() => onSelectProject(null)}
            >
              <FolderOpen className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Geral</div>
                <div className="text-xs text-white/50">Chat global</div>
              </div>
            </Button>

            {/* Lista de Projetos */}
            {projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "group flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                  currentProjectId === project.id
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 shadow-lg shadow-primary/20"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary/30"
                )}
                onClick={() => onSelectProject(project.id)}
              >
                <FolderOpen className="h-5 w-5 text-primary/80 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-white/50 truncate">{project.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 flex-shrink-0 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}

            {/* Botão Criar Novo Projeto */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-white border-white/20 hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 rounded-xl p-4 h-auto transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Novo Projeto</div>
                    <div className="text-xs text-white/50">Criar contexto</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Novo Projeto</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Defina um contexto específico para suas conversas. O agente lembrará do assunto deste projeto.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nome do Projeto</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Projeto Financeiro, Cliente X..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Descrição (opcional)</Label>
                    <Input
                      id="description"
                      placeholder="Breve descrição do projeto"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-white">Contexto do Projeto</Label>
                    <Textarea
                      id="context"
                      placeholder="Descreva o contexto/assunto deste projeto. Ex: Gestão financeira do setor de vendas, análise de dados do cliente X..."
                      value={newProjectContext}
                      onChange={(e) => setNewProjectContext(e.target.value)}
                      className="bg-white/5 border-white/20 text-white min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                    Criar Projeto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        {!collapsed && (
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Histórico
            </h2>
            {currentProjectId && (
              <p className="text-xs text-white/50 mt-0.5">
                {projects.find(p => p.id === currentProjectId)?.name}
              </p>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <ScrollArea className="h-[calc(100vh-22rem)]">
          <div className="p-4 space-y-3">
            {sortedItems.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <div className="p-4 rounded-full bg-white/5 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-sm font-medium">Nenhuma consulta ainda</p>
                <p className="text-xs mt-1">Suas conversas aparecerão aqui</p>
              </div>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group relative p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]",
                    selectedId === item.id 
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 shadow-lg shadow-primary/20" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary/30"
                  )}
                  onClick={() => onItemClick(item)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-primary/20 border-primary/30 text-primary-foreground font-medium px-2 py-1"
                    >
                      {item.systemName}
                    </Badge>
                    <div className="ml-auto flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 rounded-lg"
                      >
                        <Star 
                          className={cn(
                            "h-4 w-4 transition-all",
                            item.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white/60 hover:text-yellow-400"
                          )} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:scale-110 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-relaxed">
                    {item.question}
                  </p>
                  
                  <p className="text-xs text-white/50 line-clamp-2 mb-3 leading-relaxed">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Clock className="h-3.5 w-3.5" />
                      {item.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    {item.isFavorite && (
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
