
const ROLE_KEYWORDS = {
  drink: [
    'drink', 'soda', 'cola', 'tea', 'coffee',
    'lemonade', 'freeze', 'frosty', 'smoothie',
    'shake', 'juice', 'water', 'baja blast',
    'cold brew', 'dr pepper', 'latte',
    'horchata', 'hawaiian sun', 'jarritos'
  ],

  side: [
    'fries', 'chips', 'side of', 'mac & cheese',
    'onion rings', 'coleslaw', 'texas toast',
    'mashed potatoes', 'fried okra',
    'potato salad', 'side salad',
    'fried pickles', 'fried chickpeas',
    'house salad', 'cinnamon sticks'
  ],

  addon: [
    'cookie', 'apple pie', 'cinnamon twists',
    'cheesecake', 'ice cream', 'dessert',
    'icedream', 'dole soft serve',
    'dole whip', 'banana pudding',
    'baklava', 'sauce', 'brownie'
  ],

  main: [
    'burger', 'sandwich', 'burrito', 'taco',
    'quesadilla', 'nuggets', 'wrap', 'bowl',
    'big mac', 'mcchicken', 'baconator',
    'filet-o-fish', "dave's single",
    'quarter pounder', 'nachos bellgrande',
    'gordita crunch', 'chili', 'bites',
    'breakfast on a bun', 'combo',
    'chicken fingers', 'double-double',
    'wings', 'plate', 'salad',
    'smokeshack', 'chicken shack',
    'veggie shack', 'melt', 'soup',
    'sub', 'huli huli chicken',
    'teriyaki chicken', 'katsu chicken',
    'luau pig', 'honolulu chicken',
    'pizza', 'stoner pie', 'pepperoni rolls',
    'jalapeño popper', 'pita',
    'spanakopita', 'waffles',
    'eggs benedict', 'carbonara', 'chicken tender',
    'fried chicken', 'double classic', 'mcnuggets',
    'crunchwrap', 'whataburger', 'cheeseburger',
    'hamburger', 'shackburger', 'tacos'
  ]
};

export function getMealRole(item) {
  const category = String(item.category ?? '').toLowerCase().trim();

  const categoryRoles = {
    main: 'main',
    entree: 'main',
    entrée: 'main',
    side: 'side',
    sides: 'side',
    drink: 'drink',
    drinks: 'drink',
    beverage: 'drink',
    beverages: 'drink',
    addon: 'addon',
    'add-on': 'addon',
    dessert: 'addon',
    desserts: 'addon'
  };

  if (categoryRoles[category]) {
    return categoryRoles[category];
  }

  const name = String(item.name ?? '').toLowerCase();

  //complete dishes that contain side-food keywords
  if(name == 'fish & chips'){
    return 'main';
  }

  for (const role of ['drink', 'side', 'addon', 'main']) {
    if (ROLE_KEYWORDS[role].some(keyword => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(^|[^a-z])${escaped}(?=$|[^a-z])`, 'i');
      return pattern.test(name);
    })) {
      return role;
    }
  }

  return null;
}
