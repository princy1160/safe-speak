import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Counselor } from "@shared/schema";
import { getInitials } from "@/lib/utils";

interface CounselorInfoProps {
  onBookSession: (counselorId: number) => void;
}

export default function CounselorInfo({ onBookSession }: CounselorInfoProps) {
  // Fetch counselors data
  const { data: counselors, isLoading } = useQuery<Counselor[]>({
    queryKey: ["/api/counselors"],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle>Counselors</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="bg-purple-50">
        <CardTitle>Counselors</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {counselors && counselors.length > 0 ? (
            counselors.map((person) => (
              <div key={person.id} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Avatar>
                      <AvatarImage src={person.imageUrl} alt={person.name} />
                      <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{person.name}</p>
                    <p className="text-xs text-gray-500">{person.title}</p>
                  </div>
                  <Button 
                    size="sm"
                    variant="secondary"
                    className="text-white bg-accent hover:bg-accent/90"
                    onClick={() => onBookSession(person.id)}
                  >
                    Book
                  </Button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Email: {person.email}</p>
                  <p>Specializes in: {person.specialties}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No counselor information available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
