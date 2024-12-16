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
