#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

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
};

struct Restaurant {
    int id;
    string name;
    bool isOpen;
    vector<MenuItem> menuItems;
};


////////////////function to calculate value of a meal by it's nutrition and price. 
double calculateValue(const MenuItem& item) {
    return (item.nutrition.calories + (10.0 * item.nutrition.protein)) / item.price;
}


size_t WriteCallback(void* contents, size_t size, size_t nmenb, string* output) {
    size_t totalSize = size *  nmenb;
    output->append((char*)contents, totalSize);
    return totalSize;
}

string getAPIData() {
    CURL* curl;
    CURLcode result;
    string response;

    curl = curl_easy_init();

    if(curl){
        curl_easy_setopt(curl, CURLOPT_URL, "https://userweb.cs.txstate.edu/~zld17/api.php");
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        result = curl_easy_perform(curl);

        if(result != CURLE_OK) {
            cerr << "API request failed:" << curl_easy_strerror(result) << endl;
        }

        curl_easy_cleanup(curl);
    }

    return response;
}

int main() {
    
    vector<MenuItem> meals;
    string response = getAPIData();
    json data = json::parse(response);

    /////get the data from the api
    for(const auto& restaurant : data["data"]){
       // cout << "Restaurant: " << restaurant["name"] << endl;

        for (const auto& item : restaurant["menu_items"]) {
            MenuItem meal;

           ///////////////food information
            meal.id = item["id"];
            meal.name = item["name"];
            meal.category = item["category"];
            meal.restaurantName = restaurant["name"];
            meal.price = item["price"];

            ////////////////food description
            meal.nutrition.calories = item["nutrition"]["calories"];
            meal.nutrition.protein = item["nutrition"]["protein_g"];
            meal.nutrition.carbs = item["nutrition"]["carbs_g"];
            meal.nutrition.fat = item["nutrition"]["fat_g"];
            meal.nutrition.fiber = item["nutrition"]["fiber_g"];
            meal.nutrition.sodium = item["nutrition"]["sodium_mg"];

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

    //sort the meals by value score in descending order
    sort(meals.begin(), meals.end(), [](const MenuItem& a, const MenuItem& b) {
        return calculateValue(a) > calculateValue(b);
    });
///////////outputs in ranks with price and value and calories and protein
    int rank = 1;
    for(const MenuItem& meal : meals) {
        double value = calculateValue(meal);

        cout << rank << ". " << meal.name << " - " << meal.restaurantName << endl;
        cout << " Price: $" << meal.price << endl;
        cout << " Calories: " << meal.nutrition.calories << endl;
        cout << " Protein: " << meal.nutrition.protein << "g" << endl;
        cout << " Value Score: " << value << endl; 
        cout << "______________________________" << endl;

        rank++;
        }

    cout << "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$" << endl;

    return 0;
}
