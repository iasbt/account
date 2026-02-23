
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const length = 15;
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
let password = "";
for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
}

// Ensure at least one of each required type
const types = [
    /[a-z]/,
    /[A-Z]/,
    /[0-9]/,
    /[!@#$%^&*()_+]/
];

let valid = true;
for(const type of types) {
    if(!type.test(password)) {
        valid = false;
        break;
    }
}

// Simple retry logic if randomness didn't hit all buckets (statistically rare for length 15 but possible)
while(!valid) {
    password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    valid = true;
    for(const type of types) {
        if(!type.test(password)) {
            valid = false;
            break;
        }
    }
}

const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);

console.log(JSON.stringify({ password, hash }));
