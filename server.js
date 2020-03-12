'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { stock, customers } = require('./data/promo')

// To keep track of the current client when we get to the order confirmation sheeT:

let currentOrder = 101;

// Create empty array to store list items:
let listItems = [];

const PORT = process.env.PORT || 8000;
// Endpoint handlers:
const handleMain = (req, res) => {
    res.render("pages/todos", {
        title: "To Do List",
        list: listItems
    })
};
// Exercise 1: 
// Data Handler
const handleData = (req, res) => {
    // What is happening here? The form "POST"s the 'list_item' to the server inside the request body, and then you use object deconstruction
    // to extract the input, append that input to the listItems array, and refresh the page, which displays all items in the array.
    const { list_item } = req.body;
    listItems.push(list_item);
    res.redirect("/");
}

// Exercise 2: Order Form Reciever endpoint
const handleOrders = (req, res) => {
    let info = req.body;
    // empty respo body form; gets filled in by our various validation checks; default is that it's okay.
    let responseBody = {
        'status': 'success',
        'error': null,
        'info': null
    };
    // extracting fields individually:

    let { givenName } = info;
    let { surname } = info;
    let { email } = info;
    let { address } = info;
    let { city } = info;
    let { province } = info;
    let { postcode } = info;
    let { country } = info;
    let { order } = info;
    let { size } = info;

    // Calculate if client's name is already in the database (used further down):
    let customerFirstName = "";
    let customerLastName = "";
    let customerFirstNameMatch = customers.find(customer => customer.givenName === `${givenName}`);
    let customerLastNameMatch = customers.find(customer => customer.surname === `${surname}`);
    if (customerFirstNameMatch) {
        customerFirstName = customerFirstNameMatch.givenName;
    }
    if (customerLastNameMatch) {
        customerLastName = customerLastNameMatch.surname;
    }

    // Prepare to push non-order data to client database IF the order goes through:

    let client = {
        order: order,
        size: size,
        givenName: givenName,
        surname: surname,
        email: email,
        address: address,
        city: city,
        province: province,
        postcode: postcode,
        country: country,
        // client gets a unique order number to identify them quickly when they go in the client database...
        clientNumber: currentOrder
    };
    // check country to make sure it's Canada:
    if (country != 'Canada') {
        responseBody.status = 'error',
        responseBody.error = '650'
        res.send(responseBody);
    }
    // Check stock of desired item:
    if ((stock[order] == 0) || (stock.shirt[size] == 0)) {
        responseBody.status = 'error',
        responseBody.error = '450'
        res.send(responseBody);
    }
    // Check if you've already placed an order; if not you'll be added to the client database..
    if ((customerFirstName === givenName) && (customerLastName === surname)) {
        responseBody.status = 'error';
        responseBody.error = '550';
        res.send(responseBody);
    // If you clear all of these hurdles you can go ahead to the order conf screen; you are also added to the clients' db:
    }
    // Theoretically if we had multiple customers this would set the number for the next one...
    console.log("current order " + currentOrder);
    customers.push(client);
    responseBody.info = info;
    console.log(client);
    res.send(responseBody);
};

// Exercise 2: Order Confirmation Endpoint

const handleConfirmation = (req, res) => {
    let theClient = customers.find(customer => customer.clientNumber === currentOrder);
    // Set order number for the next customer here so we don't lost track of our current client too soon!
    currentOrder += 1;
    console.log("here!");
    console.log(theClient);
    res.render('pages/order-confirmation', {
        order: theClient.order,
        size: theClient.size,
        givenName: theClient.givenName,
        surname: theClient.surname,
        email: theClient.email,
        address: theClient.address,
        city: theClient.city,
        province: theClient.province,
        postcode: theClient.postcode,
        country: theClient.country
    })
}


express()
    .use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    })
	.use(morgan('tiny'))
    .use(express.static('public'))
    .use(bodyParser.json())
    .use(express.urlencoded({extended: false}))
    .set('view engine', 'ejs')

    // endpoints

    .get("/", handleMain)
    .post("/form-data", handleData)
    .post("/order", handleOrders)
    .get("/order-confirmation", handleConfirmation)


    .get('*', (req, res) => res.send('Dang. 404.'))
    .listen(PORT, () => console.log(`Listening on port ${PORT}`));