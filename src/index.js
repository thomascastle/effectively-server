const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/effectively", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(() => {
  console.log(`Server is running at http://localhost:4000`);
});
