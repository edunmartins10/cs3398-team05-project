#ifdef BITEWISE_JSON_RANKER

#include <algorithm>
#include <cmath>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

struct RankedOrder {
    json result;
    double score;
    long long priceCents;
    std::string name;
};

double calculateValue(double calories, double protein, double price) {
    return (calories + (10.0 * protein)) / price;
}

double calculateDietaryScore(const json& item) {
    const auto number = [&item](const char* key) {
        return item.contains(key) && item[key].is_number() ? item[key].get<double>() : 0.0;
    };
    return (number("protein") * 10) + (number("fiber") * 10) + (number("carbs") * 10)
        - (number("sodium") / 1000) - (number("fat") * 10) - number("calories");
}

int main() {
    try {
        json request;
        std::cin >> request;
        if (!request.is_object() || !request.contains("items") || !request["items"].is_array()) {
            throw std::runtime_error("Ranking input must include an items array.");
        }

        const auto budgetCents = request.at("budgetCents").get<long long>();
        const auto minimumCalories = request.at("minimumCalories").get<double>();
        const auto combos = request.at("combos").get<bool>();
        const auto goal = request.at("goal").get<std::string>();
        const auto selected = request.at("selectedRestaurants").get<std::vector<std::string>>();
        const auto isSelected = [&selected](const std::string& restaurant) {
            return std::find(selected.begin(), selected.end(), restaurant) != selected.end();
        };

        std::vector<json> eligibleItems;
        for (const auto& item : request["items"]) {
            if (!item.is_object() || !item.contains("id") || !item.contains("restaurant")
                || !item.contains("name") || !item.contains("price") || !item.contains("calories")
                || !item.contains("protein")) {
                continue;
            }
            if (!item["restaurant"].is_string() || !item["name"].is_string()
                || !item["price"].is_number_integer() || !item["calories"].is_number()
                || !item["protein"].is_number()) {
                continue;
            }
            if (item["price"].get<long long>() <= 0 || !isSelected(item["restaurant"].get<std::string>())) {
                continue;
            }
            eligibleItems.push_back(item);
        }

        std::vector<RankedOrder> orders;
        const auto addOrder = [&](const json& first, const json* second) {
            const auto priceCents = first["price"].get<long long>()
                + (second ? (*second)["price"].get<long long>() : 0);
            const auto calories = first["calories"].get<double>()
                + (second ? (*second)["calories"].get<double>() : 0.0);
            const auto protein = first["protein"].get<double>()
                + (second ? (*second)["protein"].get<double>() : 0.0);
            if (priceCents > budgetCents || calories < minimumCalories) return;

            const auto priceDollars = priceCents / 100.0;
            const auto caloriesPerDollar = calories / priceDollars;
            const auto proteinPerDollar = protein / priceDollars;
            const auto valueScore = calculateValue(calories, protein, priceDollars);
            auto name = first["name"].get<std::string>();
            if (second) {
                name = first["id"] == (*second)["id"]
                    ? "2 x " + name
                    : name + " + " + (*second)["name"].get<std::string>();
            }

            double score = valueScore;
            if (goal == "price") score = -static_cast<double>(priceCents);
            else if (goal == "protein") score = proteinPerDollar;
            else if (goal == "calories") score = caloriesPerDollar;

            json result = {
                {"restaurant", first["restaurant"]},
                {"name", name},
                {"price", priceCents},
                {"calories", calories},
                {"protein", protein},
                {"source", first.value("source", std::string("database"))},
                {"cpd", caloriesPerDollar},
                {"ppd", proteinPerDollar},
                {"valueScore", valueScore},
                {"dietaryScore", calculateDietaryScore(first)},
                {"score", score}
            };
            orders.push_back({std::move(result), score, priceCents, name});
        };

        for (std::size_t i = 0; i < eligibleItems.size(); ++i) {
            const auto& first = eligibleItems[i];
            addOrder(first, nullptr);
            if (!combos) continue;
            for (std::size_t j = i; j < eligibleItems.size(); ++j) {
                const auto& second = eligibleItems[j];
                if (first["restaurant"] == second["restaurant"]) addOrder(first, &second);
            }
        }

        const auto orderByScore = [](const RankedOrder& left, const RankedOrder& right) {
            if (left.score != right.score) return left.score > right.score;
            if (left.priceCents != right.priceCents) return left.priceCents < right.priceCents;
            return left.name < right.name;
        };
        const auto totalCount = orders.size();
        const auto outputCount = std::min<std::size_t>(7, totalCount);
        std::partial_sort(orders.begin(), orders.begin() + outputCount, orders.end(), orderByScore);

        json output = {{"totalCount", totalCount}, {"orders", json::array()}};
        for (std::size_t i = 0; i < outputCount; ++i) output["orders"].push_back(orders[i].result);
        std::cout << output.dump();
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}

#else

#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
//////////// dependant  files for the curl and nlohmann
#include "API.h"
#include <nlohmann/json.hpp>

///////////connects to the API to retrieve the data from the restaurant and menu items.
#include <curl/curl.h>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

////////////////////////structs to organize the data and make it easier to access.
struct Nutrition {
    double calories;
    double protein;
    double carbs;
    double fat;
    double fiber;
    double sodium;
};

struct MenuItem {
    int id;
    string name;
    string category;
    string restaurantName;
    double price;
    Nutrition nutrition;
    string openTime;
    string closeTime;
    double dietaryScore;
};

struct Restaurant {
    int id;
    string name;
    bool isOpen;
    string openTime;
    string closeTime;
    vector<MenuItem> menuItems;
};


////////////////function to calculate value of a meal by it's nutrition and price. 
double calculateValue(const MenuItem& item) {
    return (item.nutrition.calories + (10.0 * item.nutrition.protein)) / item.price;
}

///////////////function to calculate dietary score based on nutrition information.
double calculateDietaryScore(const Nutrition& nutrition){
    return (nutrition.protein * 10) + (nutrition.fiber * 10)  + (nutrition.carbs * 10) - (nutrition.sodium / 1000) - (nutrition.fat * 10) - nutrition.calories;
}


string convertTo12Hour(string time24) {
    int hour = stoi(time24.substr(0,2));
    int minute = stoi(time24.substr(3,2));

    string period;

    if(hour >= 12 ){
        period = "PM";
    } else {
        period = "AM";
    }

    if(hour == 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }
    return to_string(hour) + ":" + (minute < 10 ? "0" : "") + to_string(minute) + " " + period;
}


int main() {
    
    /////get the data from the api
    vector<MenuItem> meals;
    string response = getAPIData();
    json data = json::parse(response);

    
    for(const auto& restaurant : data["data"]){
       
        Restaurant restaurantData;
        restaurantData.id = restaurant["id"];
        restaurantData.name = restaurant["name"];
        restaurantData.isOpen = restaurant["is_open_now"];


        //check if the restaurant is open or closed

        cout << restaurantData.name << endl;

        if (restaurantData.isOpen) {
            cout << "Currently open" << endl;
        } else {
            cout << "Currently closed" << endl;
        }

        ///////warning everything is null
        if (restaurant["today_hours"].is_null()) {
    cout << restaurantData.name << ": Hours are unavailable" << endl;
    }else {
       if (restaurant["today_hours"]["open_time"].is_null()) {
        cout << restaurantData.name << ": Open time is unavailable" << endl;
        } else {
        restaurantData.openTime = convertTo12Hour(restaurant["today_hours"]["open_time"]);
        cout << restaurantData.name << " opens at: " << restaurantData.openTime << endl;
            }

        if (restaurant["today_hours"]["close_time"].is_null()) {
        cout << restaurantData.name << ": Close time is unavailable" << endl;
        } else {
        restaurantData.closeTime = convertTo12Hour(restaurant["today_hours"]["close_time"]);
        cout << restaurantData.name
             << " closes at: "
             << restaurantData.closeTime << endl;
            } 
        }

        
        //menu items
        for (const auto& item : restaurant["menu_items"]) {
            MenuItem meal;

           ///////////////food information
            meal.id = item["id"];
            meal.name = item["name"];
            meal.category = item["category"];
            meal.restaurantName = restaurant["name"];
            meal.price = item["price"];
            meal.openTime = restaurantData.openTime;
            meal.closeTime = restaurantData.closeTime;

            ////////////////food description
            if(item["nutrition"].is_null()) {
                cout << "Nutrition information is unavailable for " << meal.name << endl;
                continue;
            } //else {
            meal.nutrition.calories = item["nutrition"]["calories"];
            meal.nutrition.protein = item["nutrition"]["protein_g"];
            meal.nutrition.carbs = item["nutrition"]["carbs_g"];
            meal.nutrition.fat = item["nutrition"]["fat_g"];
            meal.nutrition.fiber = item["nutrition"]["fiber_g"];
            meal.nutrition.sodium = item["nutrition"]["sodium_mg"];
            meal. dietaryScore = calculateDietaryScore(meal.nutrition);
            //}

            meals.push_back(meal);

            /* check the data to see if it's getting it
            cout << " Item: " << item["name"] << endl;
            cout << " Price: $" << item["price"] << endl;
            cout << " Calories: " << item["nutrition"]["calories"] << endl;
            cout << " Protein: " << item["nutrition"]["protein_g"] << "g" << endl;
            cout << " Carbs: " << item["nutrition"]["carbs_g"] << "g" << endl;
            cout << " Fat: " << item["nutrition"]["fat_g"] << "g" << endl;
            cout << " Fiber: " << item["nutrition"]["fiber_g"] << "g" << endl;
            cout << " Sodium: " << item["nutrition"]["sodium_mg"] << "mg" << endl;
            cout << endl;
            */
        }
    }

    ////////sort the meals by value score in descending order
    sort(meals.begin(), meals.end(), [](const MenuItem& a, const MenuItem& b) {
        return calculateValue(a) > calculateValue(b);
    });

    sort(meals.begin(), meals.end(), [](const MenuItem& a, const MenuItem& b) {
        return a.dietaryScore > b.dietaryScore;
    });


/////////////////choices for value score or diet score
    int choice;

    cout << "Choose an option to sort the meals:" << endl;
    cout << "1. Sort by Value Score" << endl;
    cout << "2. Sort by Dietary Score" << endl;
    cin >> choice;

    if(choice == 1) {
        sort(meals.begin(), meals.end(), [](const MenuItem& a, const MenuItem& b) {
        return calculateValue(a) > calculateValue(b);});
    } else if (choice == 2) {
        sort(meals.begin(), meals.end(), [](const MenuItem& a, const MenuItem& b) {
        return a.dietaryScore > b.dietaryScore; });
    } else {
        cout << "invalid choice." << endl;
    }



///////////outputs in ranks with price and value and calories and protein
    int rank = 1;
    for(const MenuItem& meal : meals) {
        double value = calculateValue(meal);
       

        cout << rank << ". " << meal.name << " - " << meal.restaurantName << endl;
        cout << " Price: $" << meal.price << endl;
        cout << " Calories: " << meal.nutrition.calories << endl;
        cout << " Protein: " << meal.nutrition.protein << "g" << endl;
        cout << " Value Score: " << value << endl;
        cout << " Dietary Score: " << meal.dietaryScore << endl;
        if(!meal.openTime.empty() && !meal.closeTime.empty()) {
            cout << " Hours: " << meal.openTime << " - " << meal.closeTime << endl;
        }
        cout << "______________________________" << endl;

        rank++;
        }

    cout << "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$" << endl;

    return 0;
}

#endif
