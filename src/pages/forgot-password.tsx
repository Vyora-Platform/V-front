import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, ArrowRight, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Fake network delay for smooth UI feedback since backend isn't changed
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (!email.includes("@")) {
                setError("Please enter a valid email address");
                setLoading(false);
                return;
            }

            setSubmitted(true);
            toast({
                title: "Reset link sent!",
                description: "Check your email for further instructions.",
            });

        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white relative">
            {/* Back Button (App Style) */}
            <button
                onClick={() => setLocation("/login")}
                className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 relative z-20"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-[400px] px-6 py-8 flex flex-col">

                {/* App Header */}
                <div className="text-left mb-10 mt-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Forgot Password?
                    </h1>
                    <p className="text-gray-500 text-[16px] mt-3 font-medium px-4 md:px-0">
                        No worries! Enter your email and we'll send you reset instructions.
                    </p>
                </div>

                {/* Native Style Form */}
                {!submitted ? (
                    <form onSubmit={handleReset} className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 py-3">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending link...
                                </span>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center">
                        <div className="bg-green-50 rounded-3xl p-6 mb-8 border border-green-100">
                            <p className="text-green-800 font-medium">
                                We sent a password reset link to <br /><span className="font-bold text-black">{email}</span>
                            </p>
                        </div>
                        <Button
                            onClick={() => setLocation("/login")}
                            variant="outline"
                            className="w-full h-14 rounded-2xl font-bold text-lg border-2"
                        >
                            Return to Login
                        </Button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-[15px] font-medium">
                        Remember password?{" "}
                        <button
                            onClick={() => setLocation("/login")}
                            className="text-blue-600 hover:text-blue-800 font-bold ml-1 active:scale-95 transition-transform"
                        >
                            Log in
                        </button>
                    </p>
                </div>

                {/* Safe Area Spacer for Mobile */}
                <div className="h-8" />
            </div>
        </div>
    );
}
