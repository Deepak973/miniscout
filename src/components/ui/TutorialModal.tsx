"use client";

import { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Star,
  Gift,
  MessageSquare,
  Plus,
  TrendingUp,
} from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome!",
    description:
      "MiniScout is a platform where you can discover, review, and earn rewards from Farcaster mini-apps. Get paid for your valuable feedback!",
    icon: <img src="/logo.png" alt="MiniScout" className="w-8 h-8" />,
  },
  {
    title: "Discover Mini-Apps",
    description:
      "Browse through a curated collection of Farcaster mini-apps. Each app offers rewards for quality reviews. Find apps that interest you and start earning!",
    icon: <TrendingUp className="w-8 h-8 text-[#FAD691]" />,
  },
  {
    title: "Submit Reviews & Earn",
    description:
      "Rate apps from 1-5 stars and write detailed feedback. Earn both app-specific tokens and protocol rewards for every review you submit.",
    icon: <Star className="w-8 h-8 text-[#FAD691]" />,
  },
  {
    title: "Register Your Own App",
    description:
      "Own a mini-app? Register it on MiniScout to get feedback from the community. Set up token rewards and watch your app improve through user insights.",
    icon: <Plus className="w-8 h-8 text-[#FAD691]" />,
  },
  {
    title: "Track Your Rewards",
    description:
      "Monitor your earned tokens in the rewards section. Convert them to other tokens or use them within the apps you've reviewed.",
    icon: <Gift className="w-8 h-8 text-[#FAD691]" />,
  },
  {
    title: "Ready to Start! ",
    description:
      "You're all set! Connect your wallet, start exploring mini-apps, and begin earning rewards for your valuable feedback.",
    icon: <MessageSquare className="w-8 h-8 text-[#FAD691]" />,
  },
];

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  //   useEffect(() => {
  //     // Check if user has seen tutorial before
  //     const seen = localStorage.getItem("miniscout-tutorial-seen");
  //     if (seen === "true") {
  //       setHasSeenTutorial(true);
  //     }
  //   }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark tutorial as seen
      localStorage.setItem("miniscout-tutorial-seen", "true");
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("miniscout-tutorial-seen", "true");
    onClose();
  };

  const handleResetTutorial = () => {
    localStorage.removeItem("miniscout-tutorial-seen");
    setCurrentStep(0);
    setHasSeenTutorial(false);
  };

  if (!isOpen || hasSeenTutorial) return null;

  const currentTutorialStep = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-[#0F0E0E] rounded-2xl border border-[#FAD691]/30 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#FAD691]/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#ED775A]/20 flex items-center justify-center">
              {currentTutorialStep.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#FAD691] libertinus-keyboard-regular">
                {currentTutorialStep.title}
              </h3>
              <p className="text-sm text-[#C9CDCF] arimo-400">
                Step {currentStep + 1} of {tutorialSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 bg-[#ED775A]/20 text-[#FAD691] hover:bg-[#ED775A]/40 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center space-y-6">
            {/* Step Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ED775A]/20 to-[#FAD691]/20 flex items-center justify-center border-2 border-[#FAD691]/30">
                {currentTutorialStep.icon}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-[#C9CDCF] text-lg leading-relaxed arimo-400">
                {currentTutorialStep.description}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "bg-[#FAD691] scale-125"
                      : index < currentStep
                      ? "bg-[#ED775A]"
                      : "bg-[#C9CDCF]/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#FAD691]/20">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg border border-[#FAD691]/30 arimo-600 flex items-center space-x-2 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetTutorial}
              className="text-[#C9CDCF] hover:text-[#ED775A] px-3 py-2 rounded-lg arimo-600 transition-colors duration-300 text-sm"
            >
              Reset
            </button>
            <button
              onClick={handleSkip}
              className="text-[#C9CDCF] hover:text-[#FAD691] px-4 py-2 rounded-lg arimo-600 transition-colors duration-300 text-sm"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white px-6 py-2 rounded-lg arimo-600 flex items-center space-x-2 transition-all duration-300 hover:scale-105"
            >
              {!isLastStep ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <span>Explore</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
