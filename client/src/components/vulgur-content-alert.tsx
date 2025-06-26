import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface VulgarContentAlertProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
}

export default function VulgarContentAlert({ isOpen, content, onClose }: VulgarContentAlertProps) {
  // Replace the highlighted spans from the backend with styled spans
  const formatHighlightedContent = (content: string) => {
    return content.replace(
      /<span class="vulgar-highlight">(.*?)<\/span>/g,
      '<span class="bg-red-100 text-red-700 px-1 rounded">$1</span>'
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-center">
            Inappropriate Content Detected
          </DialogTitle>
          <DialogDescription className="text-center">
            We've detected potentially inappropriate content in your message. Please review the highlighted sections and revise your message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-5 sm:mt-4 sm:grid sm:grid-cols-1 sm:gap-3">
          <div 
            className="p-3 bg-gray-50 rounded-md" 
            dangerouslySetInnerHTML={{ __html: formatHighlightedContent(content) }}
          />
          
          <p className="mt-3 text-sm text-gray-500">
            Please use more respectful language. Remember that SafeSpeak is designed to facilitate constructive communication.
          </p>
          
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={onClose}
          >
            Edit Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
