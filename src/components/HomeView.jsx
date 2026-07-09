import { useState } from "react";
import { categories } from "../lib/mediaConfig";
import HomeCommand from "./HomeCommand";

function HomeView({ onStartLookup }) {
  const [homeQuery, setHomeQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "");
  const selectedCategoryDetails = categories.find((entry) => entry.id === selectedCategory);
  const selectedCategoryLabel = selectedCategoryDetails?.label.toLowerCase() || "media";

  function handleSubmit(event) {
    event.preventDefault();
    const cleanedQuery = homeQuery.trim();
    if (!selectedCategory || !cleanedQuery) return;

    onStartLookup({
      categoryId: selectedCategory,
      query: cleanedQuery,
      status: "Completed",
    });
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-5xl flex-col items-center justify-center px-4 py-10 sm:min-h-[calc(100vh-10rem)] sm:px-6 lg:px-8">
      <div className="w-full min-w-0">
        <HomeCommand
          homeQuery={homeQuery}
          selectedCategory={selectedCategory}
          selectedCategoryLabel={selectedCategoryLabel}
          onCategoryChange={setSelectedCategory}
          onQueryChange={setHomeQuery}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}

export default HomeView;
