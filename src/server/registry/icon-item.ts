import { svgToReactComponent, toComponentName } from "./svg-to-react";

export type RegistryIconSource = {
  slug: string;
  name: string;
  svg: string;
  tags: string[];
  category: { slug: string; name: string };
};

export function buildIconRegistryItem(icon: RegistryIconSource) {
  const componentName = toComponentName(icon.slug);
  return {
    name: icon.slug,
    title: icon.name,
    type: "registry:icon" as const,
    category: icon.category.slug,
    tags: icon.tags,
    componentName,
    dependencies: [] as string[],
    files: [
      {
        path: `icons/${icon.slug}.tsx`,
        content: svgToReactComponent(componentName, icon.svg),
      },
    ],
  };
}