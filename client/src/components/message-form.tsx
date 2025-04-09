import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface MessageComposerProps {
  onVulgarContent: (content: string) => void;
  onCrisisDetected: (type: 'suicide' | 'depression' | 'general', message: string) => void;
}

export default function MessageComposer({ onVulgarContent, onCrisisDetected }: MessageComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState("public");
  
  const createMessageMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      isAnonymous: boolean;
      recipientType: string;
    }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setContent("");
      
      if (data.crisis?.detected) {
        // Show user their message wasn't anonymous if force-identified
        if (data.crisis.forceIdentified && isAnonymous) {
          toast({
            title: "Important notice",
            description: "For safety reasons, suicide-related messages in public forums cannot be anonymous. Your identity has been included with this message and counselors have been notified.",
            variant: "destructive",
            duration: 10000, // Show for 10 seconds
          });
        }
        
        // Show the crisis response modal
        onCrisisDetected(data.crisis.type, content);
      } else {
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully",
        });
      }
      
      // Invalidate messages query to refresh list
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error: any) => {
      // Check if error is because of vulgar content
      if (error.status === 400 && error.vulgarContent) {
        onVulgarContent(error.highlightedContent);
      } else {
        toast({
          title: "Failed to send message",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }
    
    createMessageMutation.mutate({
      content,
      isAnonymous,
      recipientType,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Thoughts</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="message">Your Message</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Anonymous</span>
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                  aria-label="Toggle anonymous"
                />
              </div>
            </div>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
            />
          </div>
          
          <div>
            <Label className="block mb-2">Send To</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={recipientType === "public" ? "default" : "outline"}
                className="w-full"
                onClick={() => setRecipientType("public")}
              >
                Public
              </Button>
              <Button
                type="button"
                variant={recipientType === "faculty" ? "default" : "outline"}
                className="w-full"
                onClick={() => setRecipientType("faculty")}
              >
                Faculty
              </Button>
              <Button
                type="button"
                variant={recipientType === "counselor" ? "default" : "outline"}
                className="w-full"
                onClick={() => setRecipientType("counselor")}
              >
                Counselor
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createMessageMutation.isPending}
          >
            {createMessageMutation.isPending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

