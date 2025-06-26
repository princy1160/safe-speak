import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OtpVerification as OtpVerificationType } from "@shared/schema";

interface OtpVerificationProps {
  email: string;
  initialOtp?: string | null;
}

export default function OtpVerification({ email, initialOtp }: OtpVerificationProps) {
  const { verifyOtpMutation, loginMutation } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Pre-fill the OTP if it was provided (development mode only)
  useEffect(() => {
    if (initialOtp) {
      const otpDigits = initialOtp.split("");
      setOtp(otpDigits.concat(Array(6 - otpDigits.length).fill("")));
    }
  }, [initialOtp]);
  
  useEffect(() => {
    // Focus the first input on mount or the next empty input if OTP is partially filled
    const emptyIndex = otp.findIndex(digit => !digit);
    const indexToFocus = emptyIndex === -1 ? 5 : emptyIndex;
    
    if (inputRefs.current[indexToFocus]) {
      inputRefs.current[indexToFocus].focus();
    }
  }, []);
  
  // Will define an auto-verify effect after handleVerify function is declared

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Ensure only numbers are entered
    if (!/^\d*$/.test(value)) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    
    // Auto focus next input if value is entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace - move to previous input
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    
    // Check if pasted data contains only digits
    if (!/^\d+$/.test(pastedData)) return;
    
    // Fill the OTP inputs
    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });
    
    setOtp(newOtp);
    
    // Focus the last filled input or the next empty one
    const lastFilledIndex = Math.min(5, pastedData.length - 1);
    if (inputRefs.current[lastFilledIndex]) {
      inputRefs.current[lastFilledIndex].focus();
    }
  };
  
  const handleVerify = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;
    
    const verificationData: OtpVerificationType = {
      email,
      otp: otpString,
    };
    
    verifyOtpMutation.mutate(verificationData);
  };
  
  const handleResendOtp = () => {
    loginMutation.mutate({ email }, {
      onSuccess: (response: any) => {
        // If this is in development mode and devOtp is available, automatically fill it
        if (response && response.devOtp) {
          const otpDigits = response.devOtp.split("");
          setOtp(otpDigits.concat(Array(6 - otpDigits.length).fill("")));
        }
      }
    });
  };
  
  // Verify OTP if all digits are filled - defined after handleVerify to avoid reference errors
  useEffect(() => {
    // Check if all 6 digits are filled
    const isComplete = otp.length === 6 && otp.every(digit => digit !== "");
    
    // Auto verify if complete and not already verifying
    if (isComplete && !verifyOtpMutation.isPending) {
      // Small delay to allow the UI to update first
      const timer = setTimeout(() => {
        handleVerify();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [otp, verifyOtpMutation.isPending]);
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP sent to your email
        </label>
        <div className="flex space-x-2 mt-1">
          {Array(6).fill(null).map((_, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              className="w-12 h-12 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={otp[index] || ""}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-medium">Auto-verification:</span> OTP will be automatically verified when all digits are entered.
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Didn't receive the code?</span>
        <Button 
          variant="link" 
          className="text-sm p-0"
          onClick={handleResendOtp}
          disabled={loginMutation.isPending}
        >
          Resend OTP
        </Button>
      </div>
      
      <Button 
        className="w-full" 
        onClick={handleVerify}
        disabled={otp.join("").length !== 6 || verifyOtpMutation.isPending}
      >
        {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
      </Button>
    </div>
  );
}
