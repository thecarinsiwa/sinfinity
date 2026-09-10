import { EmptyState } from "@/components/ui";

type ComingSoonPageProps = {
  title: string;
  description?: string;
};

export function ComingSoonPage({
  title,
  description = "Cet écran sera branché dans une phase ultérieure du roadmap Admin.",
}: ComingSoonPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <EmptyState title="À venir" description={description} />
    </div>
  );
}
