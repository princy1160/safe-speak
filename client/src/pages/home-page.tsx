import { useState } from "react";
import Header from "@/components/header";
import MessageComposer from "@/components/message-composer";
import MessagesList from "@/components/messages-list";
import FacultyDirectory from "@/components/faculty-directory";
import CounselorInfo from "@/components/counselor-info";
import CrisisResources from "@/components/crisis-resources";
import BookingModal from "@/components/booking-modal";
import VulgarContentAlert from "@/components/vulgar-content-alert";
import CrisisResponseModal from "@/components/crisis-response-modal";

export default function HomePage() {
  const [selectedCounselor, setSelectedCounselor] = useState<number | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [vulgarContent, setVulgarContent] = useState<{
    show: boolean;
    content: string;
  }>({ show: false, content: "" });
  const [crisisResponse, setIsCrisisResponseOpen] = useState<{
    show: boolean;
    type?: 'suicide' | 'depression' | 'general';
    message?: string;
  }>({ show: false });
  
  const handleBookSession = (counselorId: number) => {
    setSelectedCounselor(counselorId);
    setIsBookingModalOpen(true);
  };
  
  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedCounselor(null);
  };
  
  const handleVulgarContent = (content: string) => {
    setVulgarContent({ show: true, content });
  };
  
  const handleCloseVulgarAlert = () => {
    setVulgarContent({ show: false, content: "" });
  };
  
  const handleCrisisResponse = (type: 'suicide' | 'depression' | 'general', message: string) => {
    setIsCrisisResponseOpen({ show: true, type, message });
  };
  
  const handleCloseCrisisResponse = () => {
    setIsCrisisResponseOpen({ show: false });
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <MessageComposer 
              onVulgarContent={handleVulgarContent}
              onCrisisDetected={handleCrisisResponse}
            />
            <MessagesList />
          </div>
          
          <div className="space-y-8">
            <FacultyDirectory />
            <CounselorInfo onBookSession={handleBookSession} />
            <CrisisResources />
          </div>
        </div>
      </main>
      
      {isBookingModalOpen && (
        <BookingModal 
          isOpen={isBookingModalOpen} 
          counselorId={selectedCounselor!}
          onClose={handleCloseBookingModal}
        />
      )}
      
      {vulgarContent.show && (
        <VulgarContentAlert 
          isOpen={vulgarContent.show}
          content={vulgarContent.content}
          onClose={handleCloseVulgarAlert}
        />
      )}
      
      {crisisResponse.show && (
        <CrisisResponseModal
          isOpen={crisisResponse.show}
          type={crisisResponse.type}
          message={crisisResponse.message}
          onClose={handleCloseCrisisResponse}
        />
      )}
    </div>
  );
}
