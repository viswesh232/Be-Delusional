require('dotenv').config();
const { sendVerificationEmail } = require('./utils/sendEmail');

const testEmail = async () => {
    console.log('--- Email Test Script ---');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '******** (Loaded)' : 'NOT LOADED');
    
    try {
        console.log('Sending test verification email to:', process.env.EMAIL_USER);
        await sendVerificationEmail(process.env.EMAIL_USER, 'http://localhost:5173/verify/test-token');
        console.log('Test successful!');
    } catch (error) {
        console.error('Test failed!');
        // Errors are already logged by the utility
    }
    process.exit();
};

testEmail();
