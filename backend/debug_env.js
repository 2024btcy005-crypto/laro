require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('Secret Length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
if (process.env.JWT_SECRET) {
    console.log('Last char code:', process.env.JWT_SECRET.charCodeAt(process.env.JWT_SECRET.length - 1));
}
