# SWE-Online-Store

## Online store web application created for ECE SWE course.

### Project Setup
1. `git clone` the repository from the GitHub
2. Run the `database.sql` file in mySQL workbench
3. Change the database credentials in `config\db.js` to your own credentials. Please do not push the changed file to the github again, you can create a `.gitignore` if you want.
    * You may want to change the `mysql` module to `mysql2` if the database connection does not work.
4. Navigate to the folder containing `package.json` and install the node packages using `npm install`
5. Navigate to the folder containing `app.js` and run the server using `node app.js`
6. Navigate to `localhost:3000` to see the site

### Pre-created Accounts
You can login to the website using the following accounts:
* Customer Account
    * Username: user1
    * Password: password123
* Administrator Account
    * Username: admin
    * Password: adminpassword123


#### Setting up PayPal Credentials

1. **Create a PayPal Developer Account**:
   - Go to the [PayPal Developer Portal](https://developer.paypal.com/) and sign in or create a new account.

2. **Create a REST API App**:
   - In the PayPal Developer Dashboard, create a new **REST API app** to get your **Client ID** and **Secret**.

3. **Store PayPal Credentials**:
   - Create a `.env` file in the root directory of your project and add the following:
     ```bash
     PAYPAL_CLIENT_ID=<your-client-id>
     PAYPAL_SECRET=<your-secret>
     ```

4. **Access Token**:
   - To obtain an access token, run the following `curl` command (replace `<your-client-id>` and `<your-secret>` with your PayPal sandbox credentials):
     ```bash
     curl -v https://api.sandbox.paypal.com/v1/oauth2/token \
          -H "Accept: application/json" \
          -H "Accept-Language: en_US" \
          -u "<your-client-id>:<your-secret>" \
          -d "grant_type=client_credentials"
     ```

   - This will return an access token that you will use for authentication in the PayPal API requests:
     ```json
     {
       "access_token": "A21AAKtpwB...Z4AFU1lr30_z4A",
       "token_type": "Bearer",
       "expires_in": 32400
     }
     ```

#### Creating an Order

1. **Create an Order**:
   - After you have the access token, you can create an order using PayPal’s API. In Postman or via `curl`, send a **POST** request to:
     ```bash
     POST https://api.sandbox.paypal.com/v2/checkout/orders
     ```
   - In the request headers, include:
     - `Authorization: Bearer <your-access-token>`
     - `Content-Type: application/json`
   
   - The request body should contain the order details:
     ```json
     {
       "intent": "CAPTURE",
       "purchase_units": [
         {
           "amount": {
             "currency_code": "USD",
             "value": "20.00"
           },
           "description": "Sample Order"
         }
       ]
     }
     ```
   - Upon success, PayPal will return an order ID and an approval URL.

#### Capturing the Payment

1. **Capture the Payment**:
   - After the user approves the payment, you can capture the payment using the order ID from the previous step. Send a **POST** request to:
     ```bash
     POST https://api.sandbox.paypal.com/v2/checkout/orders/<order-id>/capture
     ```
   - In the request headers, include:
     - `Authorization: Bearer <your-access-token>`
     - `Content-Type: application/json`

   - The response will include the payment details, including the status `COMPLETED`.
