import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, STATUS_SOLID } from "@/lib/utils";
import { Package, Truck, CheckCircle, Check, AlertCircle } from "lucide-react";

export function Badge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[status] || "bg-gray-100 text-gray-700",
        className
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "outline";
}) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("mb-1 block text-sm font-medium text-gray-700", className)}>
      {children}
    </label>
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function Table({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-700", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-gray-100 px-4 py-3 text-gray-600", className)}>{children}</td>;
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-gray-400">{icon}</div>}
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

const STEPPER_STAGES = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"] as const;

const STEPPER_ICONS: Record<string, any> = {
  created: Package,
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
};

// Horizontal progress stepper for the 5 canonical stages. The highlighted
// stage always reflects the shipment's actual current status — moving that
// status (via the admin's status-update controls) moves the highlight here
// too, so this never needs separate wiring.
export function ShipmentStepper({ status, className }: { status: string; className?: string }) {
  const currentIndex = STEPPER_STAGES.indexOf(status as any);
  const isException = status === "exception";

  return (
    <div className={cn("w-full", className)}>
      {isException && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Exception — this shipment has left the normal flow. See the timeline below for details.
        </div>
      )}
      <div className="flex items-start">
        {STEPPER_STAGES.map((stage, i) => {
          const Icon = STEPPER_ICONS[stage];
          const isDone = !isException && i < currentIndex;
          const isCurrent = !isException && i === currentIndex;
          const isLastStage = i === STEPPER_STAGES.length - 1;
          return (
            <div key={stage} className={cn("flex items-center", !isLastStage && "flex-1")}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
                    isDone && "bg-green-600 text-white",
                    isCurrent && (STATUS_SOLID[stage] || "bg-brand-600 text-white"),
                    !isDone && !isCurrent && "bg-gray-100 text-gray-400"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                </div>
                <span
                  className={cn(
                    "mt-1.5 max-w-[70px] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-xs",
                    isCurrent ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {STATUS_LABELS[stage]}
                </span>
              </div>
              {!isLastStage && (
                <div
                  className={cn(
                    "mx-1 mt-4 h-0.5 flex-1 sm:mt-5",
                    !isException && i < currentIndex ? "bg-green-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
