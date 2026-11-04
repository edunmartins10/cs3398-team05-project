Changed the language code from C++ to JS; I only did the main functions like dietary score, value score, hasallergen, meal converter, and the restaurant API. Each on their own files to be reused and easy to implement to the frontend. 
The files work the same as the C++ price Value code. I connected the api to the local website  cloned on my PC. I got 77 meals then after the filters and allergens, i got 35  remaining meals for the user, like wheat and milk. I think that what i put for the allergen inputs. 
Also in the app.jsx, I added the code to import and call the functions BELOW: 
function App() {
  const [budget, setBudget] = useState(10);
  const [goal, setGoal] = useState("balanced");
  const [minimum, setMinimum] = useState(400);
  const [combos, setCombos] = useState(true);
  const [selected, setSelected] = useState(new Set(allRestaurants));

  useEffect(() => {
    getAPIData()
        .then((restaurants) => {
            const meals = convertMeals(restaurants);
            console.log("Converted Meals:", meals);

          /////value ranking
        const rankedMeals = meals
              .filter(meal => meal.price > 0)
              .map(meal => ({
                ...meal,
               valueScore: calculateValue(meal)
            }))
            .sort((a, b) => b.valueScore - a.valueScore);

        console.table(
              rankedMeals.slice(0, 10).map(meal => ({
                Restaurant: meal.restaurantName,
                Meal: meal.name,
                Price: meal.price,
              Value: meal.valueScore.toFixed(2)
              }))
            );

        /////////dietary score
        const dietaryMeals = meals
            .map(meal => ({
             ...meal,
                dietaryScore: calculateDietaryScore(meal.nutrition)
              }))
            .sort((a, b) => b.dietaryScore - a.dietaryScore);

        console.table(
                dietaryMeals.slice(0, 10).map(meal => ({
                  Restaurant: meal.restaurantName,
                  Meal: meal.name,
                  DietaryScore: meal.dietaryScore.toFixed(2)
              }))
            );

        //////////allergen filter
        const excludedAllergens = ["milk", "wheat"];

      const filteredMeals = meals.filter(meal =>
          !hasAllergen(meal.allergens, excludedAllergens)
        );

      console.log("Meals before filtering:", meals.length);
      console.log("Meals after filtering:", filteredMeals.length);

      console.table(
          meals
            .filter(meal => hasAllergen(meal.allergens, excludedAllergens))
            .map(meal => ({
              Restaurant: meal.restaurantName,
              Meal: meal.name,
              Allergens: meal.allergens.join(", ")
            }))
          );


           })
        .catch((error) => {
            console.error("API Error:", error);
        });
}, []);

