import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User as UserIcon, Loader2, MessageSquare } from "lucide-react";
import { type Message, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter";

export default function ChatPage() {
  const { user, profile } = useAuth();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const preselectedId = searchParams.get("contact");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(preselectedId);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: students, isLoading: loadingStudents } = useQuery<User[]>({
    queryKey: [api.users.listStudents.path],
    enabled: profile?.role === "trainer",
  });

  // For students, we might need a way to find their trainer.
  // For now, let's assume they can see all trainers or we fetch a specific trainer.
  // Since we don't have a direct "get my trainer" API yet, let's list all trainers for students.
  const { data: trainers, isLoading: loadingTrainers } = useQuery<User[]>({
    queryKey: ["/api/users/trainers"], // We need this endpoint
    enabled: profile?.role === "student",
  });

  const activeOtherUserId = selectedUserId;

  const { data: messages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { otherUserId: activeOtherUserId || "" })],
    enabled: !!activeOtherUserId,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeOtherUserId || !user) return;
      return apiRequest("POST", api.messages.send.path, {
        senderId: user.id,
        receiverId: activeOtherUserId,
        content,
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.messages.list.path, { otherUserId: activeOtherUserId || "" })] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageText);
  };

  const contacts = profile?.role === "trainer" ? students : trainers;
  const isLoadingContacts = profile?.role === "trainer" ? loadingStudents : loadingTrainers;

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sidebar - Contacts */}
      <div className="w-80 border-r flex flex-col bg-card">
        <div className="p-4 border-b font-display font-bold text-xl">
          Mensajes
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoadingContacts ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
            ) : contacts?.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedUserId(contact.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedUserId === contact.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary/50"
                }`}
              >
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={contact.profileImageUrl || undefined} />
                  <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="text-left overflow-hidden">
                  <div className="font-bold truncate">{contact.firstName} {contact.lastName}</div>
                  <div className={`text-xs truncate ${selectedUserId === contact.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {contact.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeOtherUserId ? (
          <>
            <div className="p-4 border-b bg-card/50 backdrop-blur flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <span className="font-bold">Chat</span>
            </div>
            
            <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
              <div className="space-y-4">
                {messages?.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-secondary text-secondary-foreground rounded-tl-none"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-[10px] opacity-70 block mt-1 text-right">
                          {new Date(msg.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="rounded-full bg-secondary/50 border-none focus-visible:ring-primary"
                />
                <Button type="submit" size="icon" className="rounded-full h-10 w-10" disabled={sendMessageMutation.isPending}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">Tus Conversaciones</h3>
            <p className="max-w-xs">Selecciona a un {profile?.role === "trainer" ? "alumno" : "entrenador"} de la lista para comenzar a chatear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
