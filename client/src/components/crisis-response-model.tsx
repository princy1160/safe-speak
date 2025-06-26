import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface CrisisResponseModalProps {
  isOpen: boolean;
  type?: 'suicide' | 'depression' | 'general';
  message?: string;
  onClose: () => void;
}

export default function CrisisResponseModal({ isOpen, type = 'general', message, onClose }: CrisisResponseModalProps) {
  const callHelpline = () => {
    // In a real app, this would use the device's native capability to make a call
    window.location.href = "tel:1-800-273-8255";
  };
  
  const typeContent = {
    suicide: {
      title: "You Matter To Us",
      description: "We've detected concerning content related to suicide in your message. A counselor has been immediately notified and will reach out to you directly. Your life is valuable and you deserve support during this difficult time.",
      video: "https://www.youtube.com/embed/1pJAXBZ-hNQ"
    },
    depression: {
      title: "We're Here For You",
      description: "We've noticed signs of depression in your message. A counselor has been notified and will reach out to you shortly. Remember that depression is treatable, and many people find their way through it with proper support.",
      video: "https://www.youtube.com/embed/D9xJl4S6NsM"
    },
    general: {
      title: "Support Is Available",
      description: "We've noticed signs of distress in your message. Please know that you're not alone, and help is available. A counselor has been notified and will reach out to you shortly.",
      video: "https://www.youtube.com/embed/F28MGLlpP90"
    }
  };
  
  const content = typeContent[type];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
          <Heart className="h-6 w-6 text-purple-600" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-center">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-5">
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Calming Resource</h4>
            <div className="aspect-video rounded-md overflow-hidden">
              <iframe 
                src={content.video} 
                className="w-full h-full"
                title="Calming video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="mt-2 text-xs text-blue-700">
              Taking a few moments to breathe and center yourself can help reduce anxiety. If you're in immediate distress, please call the helpline below.
            </p>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Crisis Helplines - Available 24/7</h4>
            <div className="bg-red-50 p-3 rounded-md flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">National Suicide Prevention Lifeline</p>
                <p className="text-sm text-red-700">1-800-273-8255</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={callHelpline}
              >
                Call Now
              </Button>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-6 flex space-x-3">
            <Button className="flex-1">
              Talk to a Counselor Now
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              I'm OK for Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
