"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStepsProps {
  currentStep: number;
  steps: string[];
}

export function CheckoutSteps({ currentStep, steps }: CheckoutStepsProps) {
  return (
    <>
      {/* Desktop: horizontal step indicator */}
      <nav className="hidden sm:block" aria-label="Checkout progress">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <li
                key={step}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Step circle */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                      isCompleted &&
                        "border-primary bg-primary text-primary-foreground",
                      isCurrent &&
                        "border-primary bg-background text-primary",
                      !isCompleted &&
                        !isCurrent &&
                        "border-muted-foreground/30 bg-background text-muted-foreground/50"
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <Check className="size-4" />
                    ) : (
                      stepNumber
                    )}
                  </div>

                  {/* Step label */}
                  <span
                    className={cn(
                      "text-sm font-medium whitespace-nowrap",
                      isCompleted && "text-primary",
                      isCurrent && "text-foreground",
                      !isCompleted &&
                        !isCurrent &&
                        "text-muted-foreground/50"
                    )}
                  >
                    {step}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-4 h-px flex-1",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile: current step with count */}
      <div className="sm:hidden">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </p>
        <p className="text-base font-medium">{steps[currentStep - 1]}</p>
      </div>
    </>
  );
}
