import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Counselor } from "@shared/schema";

interface BookingModalProps {
  isOpen: boolean;
  counselorId: number;
  onClose: () => void;
}

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", 
  "1:00 PM", "2:00 PM", "3:00 PM"
];

export default function BookingModal({ isOpen, counselorId, onClose }: BookingModalProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Fetch counselor details
  const { data: counselor } = useQuery<Counselor>({
    queryKey: [`/api/counselors/${counselorId}`],
    queryFn: async () => {
      // Since we don't have a specific endpoint for a single counselor,
      // we'll fetch all and find the one we need
      const res = await fetch("/api/counselors");
      if (!res.ok) throw new Error("Failed to fetch counselor");
      const counselors = await res.json();
      return counselors.find((c: Counselor) => c.id === counselorId);
    },
    enabled: isOpen,
  });
  
  // Book session mutation
  const bookSessionMutation = useMutation({
    mutationFn: async (data: { counselorId: number; date: string; time: string }) => {
      const res = await apiRequest("POST", "/api/counselor-sessions", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Session booked",
        description: "Your counseling session has been booked successfully",
      });
      onClose();
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/counselor-sessions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSelectTime = (time: string) => {
    setSelectedTime(time === selectedTime ? null : time);
  };
  
  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Incomplete booking",
        description: "Please select both a date and time",
        variant: "destructive",
      });
      return;
    }
    
    const formattedDate = selectedDate.toISOString().split("T")[0];
    
    bookSessionMutation.mutate({
      counselorId,
      date: formattedDate,
      time: selectedTime,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Book a Session with {counselor ? counselor.name : "Counselor"}
          </DialogTitle>
          <DialogDescription>
            Select a date and time for your counseling session. The session will be conducted via Google Meet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-5 sm:mt-6">
          <div className="mb-4">
            <Label htmlFor="date" className="block mb-2">Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                // Disable past dates and weekends
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const day = date.getDay();
                return date < now || day === 0 || day === 6;
              }}
              className="border rounded-md p-2"
            />
          </div>
          
          <div className="mb-4">
            <Label className="block mb-2">Available Time Slots</Label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => handleSelectTime(time)}
                  className="w-full"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              className="flex-1" 
              onClick={handleConfirmBooking}
              disabled={!selectedDate || !selectedTime || bookSessionMutation.isPending}
            >
              {bookSessionMutation.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
