import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { timeAgo } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { Message, Comment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MessageWithComments extends Message {
  comments?: Comment[];
}

export default function MessagesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  // Fetch all messages
  const { data: messages, isLoading } = useQuery<MessageWithComments[]>({
    queryKey: ["/api/messages"],
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/messages/${messageId}/comments`, { content });
      return await res.json();
    },
    onSuccess: () => {
      setReplyContent("");
      setReplyToId(null);
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
      // Invalidate messages query to refresh list
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleReply = (messageId: number) => {
    if (replyToId === messageId) {
      setReplyToId(null);
      setReplyContent("");
    } else {
      setReplyToId(messageId);
      setReplyContent("");
    }
  };
  
  const handleSubmitReply = (messageId: number) => {
    if (!replyContent.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }
    
    addCommentMutation.mutate({ messageId, content: replyContent });
  };
  
  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-medium mb-4">Recent Messages</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  const getRecipientBadge = (type: string) => {
    switch (type) {
      case "public":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Public</Badge>;
      case "faculty":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Faculty</Badge>;
      case "counselor":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Counselor</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-medium mb-4">Recent Messages</h2>
      
      {messages && messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getRecipientBadge(message.recipientType)}
                    <span className="text-sm text-gray-500">{timeAgo(message.createdAt)}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {message.isAnonymous ? "Anonymous" : message.userId === user?.id ? user.name : "User"}
                  </span>
                </div>
                
                <p className="text-gray-700">{message.content}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">
                      {message.comments && message.comments.length > 0 
                        ? `Responses (${message.comments.length})` 
                        : "Responses"}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleReply(message.id)}
                    >
                      Reply
                    </Button>
                  </div>
                  
                  {/* Reply form */}
                  {replyToId === message.id && (
                    <div className="mt-3 flex space-x-2">
                      <Input
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSubmitReply(message.id)}
                        disabled={addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  )}
                  
                  {/* Comments list */}
                  {message.comments && message.comments.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {message.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <Avatar>
                              <AvatarFallback>
                                {comment.userId === user?.id ? getInitials(user.name || "U") : "U"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {comment.userId === user?.id ? user.name : "User"}
                            </p>
                            <p className="text-sm text-gray-500">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No messages yet. Be the first to share your thoughts!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

