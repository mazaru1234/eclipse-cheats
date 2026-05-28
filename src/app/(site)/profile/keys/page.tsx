import { getSession } from "@/lib/auth";
import { getUserLicenseKeys } from "@/lib/services/payments";
import { KeysList } from "@/components/profile/KeysList";

export default async function KeysPage() {
  const session = await getSession();
  const keys = await getUserLicenseKeys(session!.id);

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Мои ключи</h1>
      <div className="card mt-8 overflow-hidden">
        <KeysList
          keys={keys.map((k) => ({
            ...k,
            purchasedAt: k.purchasedAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
