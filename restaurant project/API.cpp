#include "API.h"
#include <curl/curl.h>
#include <iostream>


size_t WriteCallback(void* contents, size_t size, size_t nmenb, std::string* output) {
    size_t totalSize = size *  nmenb;
    output->append((char*)contents, totalSize);
    return totalSize;
}

std::string getAPIData() {
    CURL* curl;
    CURLcode result;
    std::string response;

    curl = curl_easy_init();

    if(curl){
        curl_easy_setopt(curl, CURLOPT_URL, "https://userweb.cs.txstate.edu/~zld17/api.php");
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        result = curl_easy_perform(curl);

        if(result != CURLE_OK) {
            std::cerr << "API request failed:" << curl_easy_strerror(result) << std::endl;
        }

        curl_easy_cleanup(curl);
    }

    return response;
}