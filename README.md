# QuickShare - Peer-to-Peer Bike Sharing Platform

## Overview

QuickShare is a full-stack web application that connects bike owners with renters. Users can either list their own bikes for rent as hosts or rent bikes from other users as guests. The platform provides secure authentication, bike listing management, and a booking system.

## Features

### User Authentication

* User Signup and Login
* Password Hashing using bcrypt
* JWT-based Authentication
* Secure Session Management

### Host Features

* List a Bike for Rent
* Add Bike Details
* View Hosted Bikes
* Manage Bike Listings

### Guest Features

* Browse Available Bikes
* View Bike Details
* Book a Bike for Specific Dates
* View Personal Bookings

### Booking System

* Select Rental Date
* Choose Number of Rental Days
* Store Booking Information in MongoDB
* Booking History Tracking

## Tech Stack

### Frontend

* HTML
* CSS
* EJS

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication & Security

* JWT (JSON Web Token)
* bcrypt

## Database Models

### User

* Name
* Email
* Password

### Bike

* Bike Name
* Bike Number
* Price Per Day
* Description

### Booking

* User Email
* Bike Name
* Booking Date
* Total Days

## Future Enhancements

* Bike Image Upload
* Online Payments
* Reviews and Ratings
* Location-Based Search
* Availability Calendar
* Admin Dashboard

## Author

Tufail Raza Khan

GitHub: https://github.com/tufail0330
