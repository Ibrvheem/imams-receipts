"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useFormState, type UseFieldArrayReturn } from "react-hook-form";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ControlledInput from "@/components/molecules/controlled-input";
import { Collapse, CollapseBody } from "@/components/motion/collapse";
import { cn } from "@/lib/utils";
import type { ReceiptDraft } from "../types";
import { formatNaira, lineTotal, num } from "../totals";
import { EMPTY_ITEM } from "../_hooks/use-receipt-form";

/**
 * Line items as an accordion: one item open for editing, the rest folded into
 * a one-line summary. Adding an item folds the others and opens the new one.
 */
export function ItemsEditor({
  items,
  values,
  openIndex,
  onOpenChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: UseFieldArrayReturn<any, "items">;
  values: ReceiptDraft["items"];
  /** Which item is open for editing (null = all folded). */
  openIndex: number | null;
  onOpenChange: (index: number | null) => void;
}) {
  const { errors } = useFormState({ name: "items" });
  const itemErrors = (errors.items ?? []) as unknown[];

  // Index of an item added this session, so only it grabs focus on open.
  const [addedIndex, setAddedIndex] = useState<number | null>(null);

  const add = () => {
    const index = items.fields.length;
    items.append(EMPTY_ITEM, { shouldFocus: false });
    setAddedIndex(index);
    onOpenChange(index);
  };

  const remove = (index: number) => {
    items.remove(index);
    setAddedIndex(null);
    onOpenChange(null);
  };

  return (
    <div className="space-y-3">
      <div>
        <AnimatePresence initial={false}>
          {items.fields.map((field, i) => {
            const open = openIndex === i;
            const item = values?.[i];
            const hasError = !!itemErrors[i];
            const qty = num(item?.quantity);
            const price = num(item?.unitPrice);

            return (
              <CollapseBody key={field.id} animateIn className="pb-2">
                <div
                  className={cn(
                    "rounded-lg border bg-background/40 transition-colors",
                    hasError && !open ? "border-loss/60" : "border-border",
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => onOpenChange(open ? null : i)}
                    className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left"
                  >
                    <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          !item?.description && "text-muted-foreground",
                        )}
                      >
                        {item?.description ||
                          (open ? "New item" : "Tap to add details")}
                      </span>
                      {!open && (
                        <span
                          className={cn(
                            "block text-xs tabular-nums",
                            hasError ? "text-loss" : "text-muted-foreground",
                          )}
                        >
                          {hasError
                            ? "Needs details"
                            : `${qty} × ${formatNaira(price)}`}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums">
                      {formatNaira(lineTotal(item))}
                    </span>
                    <ChevronDown
                      className="size-4 shrink-0 text-muted-foreground"
                      style={{
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition:
                          "transform 200ms cubic-bezier(0.23, 1, 0.32, 1)",
                      }}
                    />
                  </button>

                  <Collapse open={open} className="space-y-3 px-3 pb-3">
                    <ControlledInput
                      name={`items.${i}.description`}
                      label="Description"
                      placeholder="What was sold"
                      enterKeyHint="next"
                      autoFocus={addedIndex === i}
                    />
                    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                      <ControlledInput
                        name={`items.${i}.quantity`}
                        label="Qty"
                        type="number"
                        inputMode="numeric"
                        min={1}
                      />
                      <ControlledInput
                        name={`items.${i}.unitPrice`}
                        label="Price (₦)"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={items.fields.length === 1}
                        onClick={() => remove(i)}
                        className="px-2! text-muted-foreground hover:text-loss"
                      >
                        <Trash2 /> Remove
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(null)}
                      >
                        Done
                      </Button>
                    </div>
                  </Collapse>
                </div>
              </CollapseBody>
            );
          })}
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={add}
      >
        <Plus /> Add item
      </Button>
    </div>
  );
}
