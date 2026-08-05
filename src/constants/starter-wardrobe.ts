export type ClosetCategory = "Shirts" | "Pants" | "Shoes" | "Jackets" | "Accessories";

export type ClothingItem = {
  id: string;
  name: string;
  category: ClosetCategory;
  primaryColor: string;
  brand: string;
  thumbnail: string;
  favorite: boolean;
  isSample: boolean;
  isEditable: boolean;
  isDeletable: boolean;
};

const sampleItem = (
  id: string,
  name: string,
  category: ClosetCategory,
  primaryColor: string,
  brand: string,
  thumbnail: string,
): ClothingItem => ({
  id,
  name,
  category,
  primaryColor,
  brand,
  thumbnail,
  favorite: false,
  isSample: true,
  isEditable: false,
  isDeletable: false,
});

export const DEVELOPMENT_STARTER_WARDROBE: ClothingItem[] = [
  sampleItem("sample-shirt-white-tee", "White Crew Neck Tee", "Shirts", "White", "Uniqlo", "👕"),
  sampleItem("sample-shirt-black-polo", "Black Polo", "Shirts", "Black", "Ralph Lauren", "👕"),
  sampleItem("sample-shirt-blue-oxford", "Blue Oxford Shirt", "Shirts", "Blue", "J.Crew", "👔"),
  sampleItem("sample-shirt-gray-hoodie", "Gray Hoodie", "Shirts", "Gray", "Champion", "🥼"),
  sampleItem("sample-pants-blue-jeans", "Blue Jeans", "Pants", "Blue", "Levi's", "👖"),
  sampleItem("sample-pants-black-chinos", "Black Chinos", "Pants", "Black", "Dockers", "👖"),
  sampleItem("sample-pants-khaki-shorts", "Khaki Shorts", "Pants", "Khaki", "Gap", "🩳"),
  sampleItem("sample-pants-gray-joggers", "Gray Joggers", "Pants", "Gray", "Nike", "👖"),
  sampleItem("sample-shoes-white-sneakers", "White Sneakers", "Shoes", "White", "Adidas", "👟"),
  sampleItem("sample-shoes-black-dress", "Black Dress Shoes", "Shoes", "Black", "Cole Haan", "👞"),
  sampleItem("sample-shoes-running", "Running Shoes", "Shoes", "Blue", "Nike", "👟"),
  sampleItem("sample-shoes-brown-boots", "Brown Boots", "Shoes", "Brown", "Timberland", "🥾"),
  sampleItem("sample-jacket-denim", "Denim Jacket", "Jackets", "Blue", "Levi's", "🧥"),
  sampleItem("sample-jacket-bomber", "Black Bomber Jacket", "Jackets", "Black", "Alpha Industries", "🧥"),
  sampleItem("sample-jacket-blazer", "Navy Blazer", "Jackets", "Navy", "J.Crew", "🤵"),
  sampleItem("sample-accessory-watch", "Silver Watch", "Accessories", "Silver", "Seiko", "⌚"),
  sampleItem("sample-accessory-belt", "Black Belt", "Accessories", "Black", "Calvin Klein", "➰"),
  sampleItem("sample-accessory-sunglasses", "Sunglasses", "Accessories", "Black", "Ray-Ban", "🕶️"),
  sampleItem("sample-accessory-cap", "Yankees Cap", "Accessories", "Navy", "New Era", "🧢"),
];
