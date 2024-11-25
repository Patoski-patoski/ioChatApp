import crypto from 'crypto'

function generateRandomString(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Example usage
const randomString = generateRandomString(10); // Generates a random string of length 10
console.log(randomString);
