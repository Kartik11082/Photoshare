/**
 * fetchModel - Fetch a model from the web server.
 *
 * @param {string} url      The URL to issue the GET request.
 *
 * @returns a Promise that should be filled with the response of the GET request
 * parsed as a JSON object and returned in the property named "data" of an
 * object. If the request has an error, the Promise should be rejected with an
 * object that contains the properties:
 * {number} status          The HTTP response status
 * {string} statusText      The statusText from the xhr request
 */

// const URI = "mongodb://127.0.0.1:27017/?directCon2nection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.3";

function fetchModel(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    const error = new Error('HTTP error');
                    error.status = response.status;
                    error.statusText = response.statusText;
                    throw error;
                }
                return response.json();
            })
            .then(data => resolve({ data }))
            .catch(error => reject(error));
    });
}

export default fetchModel;
