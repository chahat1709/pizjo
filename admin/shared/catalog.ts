import rawCatalog from "./pizjo-menu-catalog.json";

export type CatalogItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  veg?: boolean;
};

export type CatalogCategory = {
  name: string;
  items: CatalogItem[];
};

export const pizjoCatalog = rawCatalog as { categories: CatalogCategory[] };

export const catalogItemCount = pizjoCatalog.categories.reduce(
  (count, category) => count + category.items.length,
  0,
);

export const catalogCategoryCount = pizjoCatalog.categories.length;

export const catalogBaseline = pizjoCatalog.categories.flatMap((category, categoryIndex) =>
  category.items.map((item, itemIndex) => ({
    ...item,
    categoryName: category.name,
    categoryIndex,
    itemIndex,
  })),
);
