mport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall, MessageCircle, Info } from "lucide-react";

export default function CrisisResources() {
  return (
    <Card>
      <CardHeader className="bg-red-50">
        <CardTitle>Crisis Resources</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <PhoneCall className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">National Suicide Prevention Lifeline</p>
              <p className="text-sm text-gray-500">1-800-273-8255</p>
              <p className="text-xs text-gray-400">Available 24/7</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <MessageCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Crisis Text Line</p>
              <p className="text-sm text-gray-500">Text HOME to 741741</p>
              <p className="text-xs text-gray-400">Available 24/7</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Campus Security</p>
              <p className="text-sm text-gray-500">123-456-7890</p>
              <p className="text-xs text-gray-400">Emergency assistance on campus</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
