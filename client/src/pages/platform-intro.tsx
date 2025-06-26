import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Mic, MessageSquare } from "lucide-react";

export default function PlatformIntro() {
  const { markIntroViewedMutation } = useAuth();
  
  const handleStart = () => {
    markIntroViewedMutation.mutate();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center bg-primary text-white">
          <CardTitle className="text-2xl font-bold">SafeSpeak Platform</CardTitle>
          <CardDescription className="text-primary-foreground">
            Your voice matters, and we're here to ensure it's heard safely
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Data Confidentiality</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your personal information and data are securely stored and remain confidential. 
                We follow strict privacy protocols to protect your identity.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Voice Protection</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your voice and messages are seen only by the intended recipients. 
                You can choose to communicate anonymously for additional privacy.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Targeted Communication</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your messages will be delivered only to the right people based on your selection 
                - public, faculty, or counselors - ensuring effective communication.
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={handleStart}
            disabled={markIntroViewedMutation.isPending}
          >
            {markIntroViewedMutation.isPending ? "Loading..." : "Start Using SafeSpeak"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
