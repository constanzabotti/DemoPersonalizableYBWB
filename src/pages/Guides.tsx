import { useGuides } from "@/hooks/use-fit-track";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, BrainCircuit, Activity, Apple } from "lucide-react";
import { Link } from "wouter";

export default function Guides() {
  const { data: guides, isLoading } = useGuides();

  const getIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'nutrition': return Apple;
      case 'concepts': return BrainCircuit;
      default: return Activity;
    }
  };

  const getColor = (category: string) => {
    switch(category.toLowerCase()) {
      case 'nutrition': return "text-green-500 bg-green-500/10";
      case 'concepts': return "text-purple-500 bg-purple-500/10";
      default: return "text-blue-500 bg-blue-500/10";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Educational Hub</h1>
        <p className="text-muted-foreground">Master the science of fitness.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div>Loading guides...</div>
        ) : (
          guides?.map((guide) => {
            const Icon = getIcon(guide.category);
            const colorClass = getColor(guide.category);
            
            return (
              <Card key={guide.id} className="group hover:border-primary/50 transition-colors flex flex-col h-full">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary">{guide.category}</Badge>
                  </div>
                  <CardTitle className="font-display text-xl mb-2">{guide.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {guide.content.substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-0">
                  <Link href={`/guides/${guide.slug}`}>
                    <Button variant="ghost" className="w-full justify-between hover:bg-secondary group-hover:text-primary">
                      Read Guide <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
