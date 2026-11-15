import { requireUser } from "@/lib/dal";
import ProfileMenu from "./profile-menu";

export default async function UserProfile() {
  const { name, email } = await requireUser();
  return <ProfileMenu name={name} email={email} />;
}
