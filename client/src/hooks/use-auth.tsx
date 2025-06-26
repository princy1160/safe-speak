import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LoginData, 
  User, 
  OtpVerification, 
  ProfileUpdate 
} from "@shared/schema";

// Type for login response in development mode
interface LoginResponse {
  message: string;
  email: string;
  devOtp?: string; // Optional for development mode only
}
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  needsProfileSetup: boolean;
  needsIntro: boolean;
  loginMutation: ReturnType<typeof useMutation<LoginResponse, Error, LoginData>>;
  verifyOtpMutation: ReturnType<typeof useMutation<any, Error, OtpVerification>>;
  updateProfileMutation: ReturnType<typeof useMutation<any, Error, ProfileUpdate>>;
  markIntroViewedMutation: ReturnType<typeof useMutation<any, Error, void>>;
  logoutMutation: ReturnType<typeof useMutation<void, Error, void>>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [needsIntro, setNeedsIntro] = useState(false);

  // Fetch current user
  const {
    data: userData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            return { user: null };
          }
          throw new Error("Failed to fetch user");
        }
        
        const data = await res.json();
        setNeedsProfileSetup(data.needsProfileSetup);
        setNeedsIntro(data.needsIntro);
        return data;
      } catch (error) {
        console.error("Error fetching user:", error);
        return { user: null };
      }
    },
    retry: false,
  });

  // Login (request OTP)
  const loginMutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpVerification) => {
      const res = await apiRequest("POST", "/api/auth/verify", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setNeedsProfileSetup(data.needsProfileSetup);
      setNeedsIntro(data.needsIntro);
      queryClient.setQueryData(["/api/auth/user"], data);
      
      toast({
        title: "Verification successful",
        description: "You are now logged in",
      });
      
      if (data.needsProfileSetup) {
        setLocation("/profile-setup");
      } else if (data.needsIntro) {
        setLocation("/platform-intro");
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const res = await apiRequest("POST", "/api/auth/profile", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setNeedsProfileSetup(data.needsProfileSetup);
      setNeedsIntro(data.needsIntro);
      queryClient.setQueryData(["/api/auth/user"], data);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      if (data.needsIntro) {
        setLocation("/platform-intro");
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark intro as viewed
  const markIntroViewedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/intro-viewed", {});
      return await res.json();
    },
    onSuccess: (data) => {
      setNeedsIntro(false);
      queryClient.setQueryData(["/api/auth/user"], data);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update preference",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], { user: null });
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: userData?.user || null,
        isLoading,
        error: error as Error,
        needsProfileSetup,
        needsIntro,
        loginMutation,
        verifyOtpMutation,
        updateProfileMutation,
        markIntroViewedMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
