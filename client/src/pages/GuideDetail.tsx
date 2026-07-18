import { useGuide } from "@/hooks/use-fit-track";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function GuideDetail() {
  const [, params] = useRoute("/guides/:slug");
  const { data: guide, isLoading } = useGuide(params?.slug || "");

  if (isLoading) return <div className="p-8">Loading guide...</div>;
  if (!guide) return <div className="p-8">Guide not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link href="/guides">
        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
          <ChevronLeft className="mr-2 w-4 h-4" /> Back to Hub
        </Button>
      </Link>

      <article className="prose prose-slate dark:prose-invert lg:prose-xl max-w-none">
        <div className="mb-8 not-prose">
          <span className="text-sm font-bold tracking-wider text-primary uppercase mb-2 block">{guide.category}</span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mb-4">{guide.title}</h1>
          <div className="h-1 w-20 bg-primary rounded-full"></div>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm whitespace-pre-line leading-relaxed">
          {guide.content}
        </div>
      </article>
    </div>
  );
}
