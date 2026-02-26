import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) => {
  // Separate common categories from others to keep UI clean
  const commonCategories = ["All", "Cricket", "Pakistani Channels", "Indian Channels", "Islamic", "Sports", "News", "Kids", "Movies"];
  
  const mainCategories = categories.filter(c => commonCategories.includes(c));
  const otherCategories = categories.filter(c => !commonCategories.includes(c));

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex flex-col gap-2 pb-2">
        {/* Main Categories Row */}
        <div className="flex gap-2">
          {mainCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => onSelectCategory(category)}
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
        
        {/* Other Categories Row (if any) */}
        {otherCategories.length > 0 && (
          <div className="flex gap-2">
            {otherCategories.slice(0, 15).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => onSelectCategory(category)}
                className="shrink-0 h-8 text-xs opacity-80"
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default CategoryFilter;
