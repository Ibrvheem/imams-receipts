"use client";

import { useState, type ReactNode } from "react";
import { useController, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapse } from "@/components/motion/collapse";

/** One-tap choice chips — quicker on a phone than opening a dropdown. */
export function ChipField<T extends string | boolean>({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { label: string; value: T }[];
}) {
  const { field } = useController({ name });
  return (
    <div className="space-y-2">
      <p id={`${name}-label`} className="text-sm font-medium">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => {
          const selected = field.value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => field.onChange(option.value)}
              className={cn(
                "min-h-11 rounded-md border px-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-border-hi hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * An optional field hidden behind a "+ Add …" link. It stays open while it
 * has a value; "Remove" clears it and folds it away again.
 */
export function OptionalField({
  name,
  addLabel,
  emptyValue = "",
  children,
}: {
  name: string;
  addLabel: string;
  emptyValue?: unknown;
  /** Receives true when just opened, so the field can grab focus. */
  children: (justOpened: boolean) => ReactNode;
}) {
  const { watch, setValue } = useFormContext();
  const value = watch(name);
  const hasValue = value !== "" && value != null;
  const [open, setOpen] = useState(false);

  const shown = open || hasValue;

  // The link folds away as the field folds in (and back), so the panel
  // height changes smoothly instead of jumping.
  return (
    <div>
      <Collapse open={!shown}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-4" /> {addLabel}
        </button>
      </Collapse>
      <Collapse open={shown}>
        <div className="relative">
          {children(open && !hasValue)}
          <button
            type="button"
            aria-label={`Remove ${name}`}
            onClick={() => {
              setValue(name, emptyValue, {
                shouldValidate: true,
                shouldDirty: true,
              });
              setOpen(false);
            }}
            className="absolute -top-1.5 right-0 inline-flex min-h-8 items-center gap-1 px-1 text-xs text-muted-foreground hover:text-loss"
          >
            <X className="size-3.5" /> Remove
          </button>
        </div>
      </Collapse>
    </div>
  );
}
