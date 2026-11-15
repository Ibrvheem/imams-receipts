"use client";

import { useSyncExternalStore } from "react";
import { useFormContext } from "react-hook-form";
import { BookUser } from "lucide-react";
import { toast } from "sonner";

// Contact Picker API — Chrome on Android. Not in the TS DOM types yet.
type PickedContact = { name?: string[]; tel?: string[] };
type ContactsManager = {
  select: (props: ("name" | "tel")[], options?: { multiple?: boolean }) => Promise<PickedContact[]>;
};
const contactsApi = () =>
  (navigator as Navigator & { contacts?: ContactsManager }).contacts;

const supported = () => typeof window !== "undefined" && "contacts" in navigator && !!contactsApi()?.select;
const noSubscribe = () => () => {};

/** "+234 803 123 4567" / "2348031234567" → "08031234567"; other formats left tidy. */
export function normalizePhone(raw: string) {
  const compact = raw.replace(/[^\d+]/g, "");
  if (compact.startsWith("+234")) return `0${compact.slice(4)}`;
  if (compact.startsWith("234") && compact.length === 13) return `0${compact.slice(3)}`;
  return compact;
}

/**
 * Fills the customer's name and phone from her phone's contacts. Only the
 * contact she picks is shared with the app. Hidden where unsupported (iPhone).
 */
export function ContactPickerButton() {
  const available = useSyncExternalStore(noSubscribe, supported, () => false);
  const { setValue, getValues } = useFormContext();
  if (!available) return null;

  const pick = async () => {
    try {
      const [contact] = await contactsApi()!.select(["name", "tel"]);
      if (!contact) return; // closed the picker
      const name = contact.name?.find(Boolean)?.trim();
      const phone = contact.tel?.find(Boolean);
      const opts = { shouldDirty: true, shouldValidate: true };
      // A different person: drop any saved customer link and old address.
      setValue("customerId", "", opts);
      if (name) setValue("customerName", name, opts);
      setValue("customerPhone", phone ? normalizePhone(phone) : "", opts);
      if (getValues("customerAddress")) setValue("customerAddress", "", opts);
      if (!phone) toast("That contact has no phone number saved.");
    } catch {
      toast.error("Couldn't open your contacts.");
    }
  };

  return (
    <button
      type="button"
      onClick={pick}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground active:bg-muted"
    >
      <BookUser className="size-4" /> From contacts
    </button>
  );
}
