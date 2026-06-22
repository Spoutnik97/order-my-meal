export const BASES = ['salade', 'pâtes', 'quinoa', 'lentilles', 'pâtes + salade', 'quinoa + salade'] as const;
export const SAUCES = ['vinaigrette', "huile d'olive", 'citron'] as const;
export const TOPPINGS = ['coriandre', 'basilic', 'croutons'] as const;
export const SIZES = [4, 6] as const;

export const INGREDIENTS = [
  'jambon sec', 'jambon cru', 'thon', 'crevettes', 'sardines', 'saumon fumé',
  'avocat', 'carottes', 'concombres', 'champignons cuisinés', 'champignons crus',
  'feta', 'mozzarella', 'tomates séchées', 'artichaut', 'haricots',
  'tomates', 'olives', 'oignons rouges', 'emmental', 'oeuf', 'maïs',
] as const;

export type Base = typeof BASES[number];
export type Sauce = typeof SAUCES[number];
export type Topping = typeof TOPPINGS[number];
export type Ingredient = typeof INGREDIENTS[number];
export type Size = typeof SIZES[number];
