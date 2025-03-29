import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const API_BASE_URL = "http://localhost:5000"; // Change if needed

export function MessageList({ visibility = "public" }: { visibility?: string }) {
  const { user } = useAuth();

  console.log("Fetching messages with visibility:", visibility);

  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ["/api/messages", visibility],
    queryFn: async () => {
      const searchParams = new URLSearchParams({ visibility });
      const url = `${API_BASE_URL}/api/messages?${searchParams}`;
      console.log("Fetching from:", url);

      const res = await fetch(url, {
        credentials: "include", // Ensure cookies are sent for authentication
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to fetch messages: ${errorText}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from API");
      }

      return res.json();
    },
    staleTime: 1000 * 60, // Cache messages for 1 min
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-red-500">
          <p>Error loading messages</p>
          <p className="text-xs">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No messages found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                {message.visibility === "public"
                  ? "Public Message"
                  : message.visibility === "domain"
                  ? `Domain: ${message.domain}`
                  : "Admin Only"}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.createdAt), "PPp")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{message.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
