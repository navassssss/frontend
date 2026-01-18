
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.118:8000/api',
});

// Since we cannot easily get specific user token, we'll try to hit it. 
// However, the route is protected. 
// We will modify the api.php temporarily to allow public access for debugging 
// OR we will assume the user has a token in their browser. 

// Better approach: Since we have the backend code, we can use `php artisan tinker`.
console.log("Checking via PHP artisan tinker...");
