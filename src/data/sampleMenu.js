const sample = [
  ["McDonald's", 'McDouble', 3.29, 400, 22],
  ["McDonald's", 'McChicken', 2.99, 400, 14],
  ["McDonald's", 'Small fries', 2.49, 230, 3],
  ['Taco Bell', 'Bean burrito', 1.99, 360, 13],
  ['Taco Bell', 'Cheesy bean & rice burrito', 1.49, 420, 9],
  ['Taco Bell', 'Chicken quesadilla', 5.49, 510, 26],
  ["Wendy's", 'Jr. bacon cheeseburger', 3.49, 370, 18],
  ["Wendy's", 'Crispy chicken sandwich', 2.49, 330, 14],
  ["Wendy's", 'Small chili', 3.29, 240, 16],
  ['Chick-fil-A', 'Chicken sandwich', 5.49, 420, 29],
  ['Chick-fil-A', '8-count nuggets', 5.29, 250, 27],
  ['Chick-fil-A', 'Medium waffle fries', 2.99, 420, 5],
  ['Chipotle', 'Chicken burrito bowl', 9.25, 660, 45],
  ['Chipotle', 'Veggie burrito bowl', 8.75, 620, 17],
  ['Whataburger', 'Whataburger', 5.79, 590, 29],
  ['Whataburger', 'Justaburger', 3.29, 310, 14],
  ['Whataburger', 'Small fries', 2.39, 280, 3],
];

export function createSampleMenu() {
  return sample.map((x, i) => ({
    id: i,
    restaurant: x[0],
    name: x[1],
    price: Math.round(x[2] * 100),
    calories: x[3],
    protein: x[4],
    source: 'sample',
  }));
}
