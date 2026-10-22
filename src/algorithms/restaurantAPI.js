const API_URL = "https://userweb.cs.txstate.edu/~zld17/api.php";

export async function getAPIData() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    return result.data;
}