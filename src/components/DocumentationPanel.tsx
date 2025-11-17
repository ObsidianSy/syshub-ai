import { useState } from "react";
import { FileText, Image, File, Upload, X, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface Document {
  id: string;
  name: string;
  type: string; // 'image' | 'pdf' | 'text' | 'other'
  size: number;
  url: string;
  uploadedAt: Date;
  conversationId: string;
}

interface DocumentationPanelProps {
  conversationId: string | null;
  documents: Document[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onDownload: (document: Document) => void;
}

export const DocumentationPanel = ({
  conversationId,
  documents,
  onUpload,
  onDelete,
  onDownload,
}: DocumentationPanelProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!conversationId) return;

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await handleUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!conversationId || !e.target.files) return;

    const files = Array.from(e.target.files);
    for (const file of files) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande! Máximo 10MB");
      return;
    }

    setUploadProgress(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setUploadProgress(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5" />;
      case "pdf":
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white mb-2">Documentação</h2>
        <p className="text-sm text-white/60">
          {conversationId
            ? `${documents.length} arquivo${documents.length !== 1 ? "s" : ""}`
            : "Selecione uma conversa"}
        </p>
      </div>

      {/* Upload Area */}
      {conversationId && (
        <div className="p-4 border-b border-white/10">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer hover:border-primary/50 ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-white/20 bg-white/5"
            }`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*,.pdf,.txt,.doc,.docx"
              disabled={uploadProgress}
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-white/60" />
            <p className="text-sm text-white/60">
              {uploadProgress
                ? "Enviando..."
                : "Arraste arquivos ou clique para selecionar"}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Máx 10MB • Imagens, PDFs, Documentos
            </p>
          </div>
        </div>
      )}

      {/* Documents List */}
      <ScrollArea className="flex-1 p-4">
        {!conversationId ? (
          <div className="text-center text-white/40 mt-8">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Inicie ou selecione uma conversa para anexar documentos
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center text-white/40 mt-8">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum documento anexado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="p-3 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Icon or Thumbnail */}
                  <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary">
                    {doc.type === "image" ? (
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      getFileIcon(doc.type)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {formatFileSize(doc.size)} •{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownload(doc)}
                      className="h-8 w-8 p-0 hover:bg-white/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(doc.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview for images */}
                {doc.type === "image" && (
                  <div className="mt-2">
                    <img
                      src={doc.url}
                      alt={doc.name}
                      className="w-full rounded border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(doc.url, "_blank")}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
};
