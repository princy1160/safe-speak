import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function MessageForm() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Form Initialization
  const form = useForm({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: {
      userId: user?.id || "",
      content: "",
      visibility: "public",
      domain: user?.domain || "",
    },
  });

  // Update user details dynamically
  useEffect(() => {
    if (user) {
      form.setValue("userId", user.id || "");
      form.setValue("domain", user.domain || "");
    }
  }, [user, form]);

  // API Mutation for message submission
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting message:", data);
      const res = await apiRequest("POST", "/api/messages", data);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", variables.visibility] });
      form.reset({
        userId: user?.id || "",
        content: "",
        visibility: "public",
        domain: user?.domain || "",
      });
      toast({
        title: "Message Sent",
        description: "Your message has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Message submission error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Send an Anonymous Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            {/* Message Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Type your message here..."
                      className="border border-gray-300 bg-white text-black"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility Selection */}
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border border-gray-300 bg-white text-black">
                        <SelectValue>{field.value || "Select visibility"}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="domain">Domain Only</SelectItem>
                      <SelectItem value="admin">Admin Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Domain Field (Only shows if "domain" visibility is selected) */}
            {form.watch("visibility") === "domain" && (
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter domain (if required)"
                        className="border border-gray-300 bg-white text-black"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
