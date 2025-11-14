import { useState, useRef } from "react";
import { Send, Loader2, Paperclip, Mic, X, Image as ImageIcon, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      // Se houver arquivo ou áudio anexado, você pode processar aqui
      if (attachedFile) {
        toast({
          title: "Arquivo anexado",
          description: `${attachedFile.name} será enviado com a mensagem`,
        });
      }
      if (audioBlob) {
        toast({
          title: "Áudio anexado",
          description: "Áudio gravado será enviado com a mensagem",
        });
      }
      
      onSendMessage(message);
      setMessage("");
      setAttachedFile(null);
      setAudioBlob(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo (apenas imagens)
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive",
        });
        return;
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setAttachedFile(file);
      toast({
        title: "Imagem anexada",
        description: file.name,
      });
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Áudio gravado",
          description: "Áudio pronto para ser enviado",
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Gravando áudio",
        description: "Clique novamente para parar",
      });
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRemoveAudio = () => {
    setAudioBlob(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-6">
      <form onSubmit={handleSubmit}>
        <div className="relative glass-effect rounded-2xl shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl hover:border-primary/30 transition-all duration-300">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative p-5">
            {/* Preview de arquivo anexado */}
            {attachedFile && (
              <div className="mb-3 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 flex-1">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-white/80 truncate">{attachedFile.name}</span>
                  <span className="text-xs text-white/50">
                    ({(attachedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 rounded-lg hover:bg-red-500/20 text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Preview de áudio gravado */}
            {audioBlob && (
              <div className="mb-3 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 flex-1">
                  <Mic className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-white/80">Áudio gravado</span>
                  <span className="text-xs text-white/50">
                    ({(audioBlob.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleRemoveAudio}
                  className="h-8 w-8 rounded-lg hover:bg-red-500/20 text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa sobre os sistemas (ex: vá no Opus One e me traga o estoque de produtos)"
              className="min-h-[80px] resize-none border-0 bg-transparent text-white text-base placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center justify-between px-5 pb-5 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-input"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="h-10 w-10 rounded-xl hover:bg-white/10 text-white/60 hover:text-primary transition-all duration-300 hover:scale-110 border border-transparent hover:border-primary/20 relative z-10 pointer-events-auto"
                title="Anexar imagem"
                disabled={isLoading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  isRecording ? stopRecording() : startRecording();
                }}
                className={`h-10 w-10 rounded-xl transition-all duration-300 hover:scale-110 border relative z-10 pointer-events-auto ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 border-red-400/30 animate-pulse hover:bg-red-500/30' 
                    : 'hover:bg-white/10 text-white/60 hover:text-green-400 border-transparent hover:border-green-400/20'
                }`}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
                disabled={isLoading || !!audioBlob}
              >
                {isRecording ? (
                  <StopCircle className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <div className="h-6 w-px bg-white/10 mx-1" />
              <span className="text-xs text-white/40">
                {message.length > 0 && `${message.length} caracteres`}
              </span>
            </div>
            
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shrink-0 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Helper text */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/40">
          <span>💡 Dica: Pressione Enter para enviar, Shift+Enter para nova linha</span>
        </div>
      </form>
    </div>
  );
};
