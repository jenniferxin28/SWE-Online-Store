DROP DATABASE IF EXISTS online_store;
CREATE DATABASE IF NOT EXISTS online_store;

USE online_store;

-- Create the User table
CREATE TABLE User (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    vipLevel INT DEFAULT 1, -- Default VIP level is 1
    CHECK (vipLevel BETWEEN 1 AND 5) -- Ensure VIP level is between 1 and 5
);

-- Create the Admin table (inherits from User)
CREATE TABLE Admin (
    adminID INT PRIMARY KEY,
    FOREIGN KEY (adminID) REFERENCES User(userID) ON DELETE CASCADE
);

-- Create the Registered table (inherits from User)
CREATE TABLE Registered (
    registeredID INT PRIMARY KEY,
    FOREIGN KEY (registeredID) REFERENCES User(userID) ON DELETE CASCADE
);

-- Create the Product table
CREATE TABLE Product (
    productID INT AUTO_INCREMENT PRIMARY KEY,
    productName VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    vipRequirement INT DEFAULT 1, -- VIP level required to purchase the product
    sizeOptions VARCHAR(100)
);

-- Create the Shopping Cart table
CREATE TABLE ShoppingCart (
    cartID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    totalPrice DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE
);

-- Create the Shopping Cart Contains table
CREATE TABLE ShoppingCartContains (
    cartID INT NOT NULL,
    productID INT NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (cartID, productID),
    FOREIGN KEY (cartID) REFERENCES ShoppingCart(cartID) ON DELETE CASCADE,
    FOREIGN KEY (productID) REFERENCES Product(productID) ON DELETE CASCADE
);

-- Create the Order table
CREATE TABLE OrderTable (
    orderID INT AUTO_INCREMENT PRIMARY KEY,
    cartID INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    orderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cartID) REFERENCES ShoppingCart(cartID) ON DELETE CASCADE
);

-- Create the Review table
CREATE TABLE Review (
    reviewID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    productID INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5), -- Rating must be between 1 and 5
    comment TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE,
    FOREIGN KEY (productID) REFERENCES Product(productID) ON DELETE CASCADE
);

-- Data inserts
INSERT INTO User (username, password, email, vipLevel) VALUES
('user1', 'password123', 'user1@example.com', 1),
('user2', 'password456', 'user2@example.com', 1),
('vipUser', 'password789', 'vipuser@example.com', 3);
-- Admin insert
INSERT INTO User (username, password, email, vipLevel) 
VALUES ('admin', 'adminpassword123', 'admin@example.com', 5);
SET @last_user_id = LAST_INSERT_ID();
-- Insert the admin into the Admin table
INSERT INTO Admin (adminID) VALUES (@last_user_id);
INSERT INTO Product (productName, description, category, price, stock, vipRequirement, sizeOptions) VALUES
('Poster A', 'Description for Product A', 'Prints', 10.00, 50, 1, 'Small, Medium, Large'),
('Poster B', 'Description for Product B', 'Prints', 15.00, 30, 3, 'One Size');

-- shopping cart for user 1
INSERT INTO ShoppingCart (userID, totalPrice) VALUES
(1, 20.00);
INSERT INTO ShoppingCartContains (cartID, productID, quantity) VALUES
(1, 1, 2); -- 2 quantities of Product A
-- shopping cart for user 2
INSERT INTO ShoppingCart (userID, totalPrice) VALUES
(2, 30.00);
INSERT INTO ShoppingCartContains (cartID, productID, quantity) VALUES
(2, 2, 2); -- 2 quantities of Poster B

-- review inserts
INSERT INTO Review (userID, productID, rating, comment) VALUES
(1, 1, 5, 'Great poster! Really liked the quality.'), -- poster A - user1
(2, 2, 4, 'Good print, but delivery was slow.'); -- poster B  - user2



