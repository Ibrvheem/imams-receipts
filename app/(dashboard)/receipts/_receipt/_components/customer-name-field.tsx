"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { UserRound } from "lucide-react";
import ControlledInput from "@/components/molecules/controlled-input";
import { searchCustomers, type CustomerSuggestion } from "../../service";

/**
 * Customer name with suggestions from saved customers. Picking one fills the
 * phone and address and links the receipt to that customer.
 */
export function CustomerNameField() {
  const { setValue, control } = useFormContext();
  const name: string = useWatch({ control, name: "customerName" }) ?? "";
  const customerId: string = useWatch({ control, name: "customerId" }) ?? "";
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [focused, setFocused] = useState(false);
  // Name of the linked customer (prefilled or picked).
  const [linkedName, setLinkedName] = useState(customerId ? name.trim() : "");
  const isLinked = !!customerId && name.trim() === linkedName;

  useEffect(() => {
    const q = name.trim();
    // Nothing to look up: too short, or it's the linked customer.
    if (q.length < 2 || isLinked) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await searchCustomers(q);
        if (!cancelled) setSuggestions(found);
      } catch {
        // Offline or signed out — the field still works as plain text.
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, isLinked]);

  // Typing a different name unlinks the picked customer.
  useEffect(() => {
    if (customerId && name.trim() !== linkedName) setValue("customerId", "");
  }, [name, customerId, linkedName, setValue]);

  const pick = (c: CustomerSuggestion) => {
    setLinkedName(c.name);
    const opts = { shouldDirty: true, shouldValidate: true };
    setValue("customerId", c.id, opts);
    setValue("customerName", c.name, opts);
    setValue("customerPhone", c.phone ?? "", opts);
    setValue("customerAddress", c.address ?? "", opts);
    setSuggestions([]);
  };

  const visible = focused && name.trim().length >= 2 && !isLinked ? suggestions : [];

  return (
    <div
      className="relative"
      onFocus={() => setFocused(true)}
      // Delay so a tap on a suggestion lands before the list closes.
      onBlur={() => setTimeout(() => setFocused(false), 150)}
    >
      <ControlledInput
        name="customerName"
        label="Name"
        placeholder="e.g. Aisha Bello"
        enterKeyHint="next"
        autoComplete="off"
      />
      {visible.length > 0 && (
        <ul
          role="listbox"
          aria-label="Saved customers"
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          {visible.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                className="flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm hover:bg-muted"
              >
                <UserRound className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                {c.phone && (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {c.phone}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
