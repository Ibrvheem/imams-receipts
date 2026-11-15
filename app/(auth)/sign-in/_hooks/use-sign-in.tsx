import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SignInPayload, signInPayload } from "../types";
import { SignIn } from "../service";

export function useSignIn(callbackUrl = "/home") {
  const form = useForm({
    resolver: zodResolver(signInPayload),
    defaultValues: { email: "", password: "" },
  });
  const router = useRouter();
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (data: SignInPayload) => {
    try {
      const response = await SignIn(data);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      toast.success(response.message);
      // Only same-site paths, never an open redirect.
      const next =
        callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/home";
      router.replace(next);
      router.refresh();
    } catch {
      toast.error("Couldn't sign in. Check your connection and try again.");
    }
  });

  return { form, onSubmit, isSubmitting };
}
