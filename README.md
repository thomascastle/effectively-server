# Getting Started

## Clone the repository
`git clone git@github.com:thomascastle/effectively-server.git`

## Install dependencies
`cd effectively-server`

`npm install`

## Configure
The project connects to `mongodb://localhost:27017/effectively` and runs on port 4000.

Create a database named `effectively` on your local MongoDB server.

To provide your own configurations,
create `.env` file in your project root folder and
provide your own values to `DB_HOST` and `PORT` keys in the file.

## Start
To start the server, run

`npm start`

The server should be up and running.

# What is this?
This is just a practise project developed while learning new and interesting things.

# What do you use in this project?
- Apollo Server
- GraphQL
- MongoDB
- Mongoose
