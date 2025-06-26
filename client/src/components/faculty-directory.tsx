import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Faculty } from "@shared/schema";
import { getInitials } from "@/lib/utils";

export default function FacultyDirectory() {
  // Fetch faculty data
  const { data: faculty, isLoading } = useQuery<Faculty[]>({
    queryKey: ["/api/faculty"],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle>Faculty Directory</CardTitle>
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
      <CardHeader className="bg-blue-50">
        <CardTitle>Faculty Directory</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {faculty && faculty.length > 0 ? (
            faculty.map((person) => (
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
                    <p className="text-xs text-gray-500">{person.department}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full bg-primary text-white hover:bg-primary/90">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </Button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Email: {person.email}</p>
                  <p>Office Hours: {person.officeHours}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No faculty information available</div>
          )}
          
          {faculty && faculty.length > 0 && (
            <div className="p-4 text-center">
              <Button variant="link">View All Faculty</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
