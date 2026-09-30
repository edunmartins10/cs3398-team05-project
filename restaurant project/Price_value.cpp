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
    string openTime;
    string closeTime;
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


size_t WriteCallback(void* contents, size_t size, size_t nmenb, string* output) {
    size_t totalSize = size *  nmenb;
    output->append((char*)contents, totalSize);
    return totalSize;
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
        if(!meal.openTime.empty() && !meal.closeTime.empty()) {
            cout << " Hours: " << meal.openTime << " - " << meal.closeTime << endl;
        }
        cout << "______________________________" << endl;

        rank++;
        }

    cout << "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$" << endl;

    return 0;
}
