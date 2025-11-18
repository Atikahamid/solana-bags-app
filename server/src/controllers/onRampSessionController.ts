// import knex from '../db/knex.js';
// import { generateJwt } from '@coinbase/cdp-sdk/auth';

// export const generateJWTToken = async () => {
//     const token = await generateJwt({
//         apiKeyId: process.env.KEY_NAME || '87fc9084-979b-4911-97b7-87e1ed7baa5b',
//         apiKeySecret: process.env.KEY_SECRET || '0yDWfYKXhAQlbZz855Jk4LF/JsxN+Z+iI6uCQL1I/3sBukvo6EUWqrqBfod75THrjXEuidwZZBm+ZB5W/93DRA==',
//         requestMethod: process.env.REQUEST_METHOD || 'POST',
//         requestHost: process.env.REQUEST_HOST || 'api.cdp.coinbase.com',
//         requestPath: process.env.REQUEST_PATH || '/platform/v2/onramp/sessions',
//         expiresIn: 500 // optional (defaults to 120 seconds)
//     });

//     console.log("token in function: ", token);
//     return token;
// }

// // export const generateOnRampUrl = async () => {
// //     const url = 'https://api.sandbox.cdp.coinbase.com/platform/v2/onramp/sessions';
// //     const options = {
// //         method: 'POST',
// //         headers: { Authorization: 'Bearer <token>', 'Content-Type': 'application/json' },
// //         body: '{"purchaseCurrency":"USDC","destinationNetwork":"base","destinationAddress":"0x71C7656EC7ab88b098defB751B7401B5f6d8976F","paymentAmount":"100.00","paymentCurrency":"USD","paymentMethod":"CARD","country":"US","subdivision":"NY","redirectUrl":"https://yourapp.com/success","clientIp":"127.0.0.1"}'
// //     };
// //     try {
// //         const response = await fetch(url, options);
// //         const data = await response.json();
// //         console.log(data);
// //     } catch (error) {
// //         console.error(error);
// //     }
// // }

// // export const createSession = async (data) => {
// //     const [row] = await knex('onramp_sessions').insert(data).returning('*');
// //     return row;
// // };


// // export const updateSession = async (id, patch) => {
// //     const [row] = await knex('onramp_sessions').where({ id }).update({ ...patch, updated_at: knex.fn.now() }).returning('*');
// //     return row;
// // };