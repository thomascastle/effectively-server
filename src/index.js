const { getUser } = require("./auth/utils");
const resolvers = require("./resolvers");
const typeDefs = require("./schema");
const { ApolloServer, AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/effectively", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = new ApolloServer({
  context: async ({ req }) => {
    const token = req.headers.authorization || "";
    const user = await getUser(token);

    return { user };
  },
  formatError(err) {
    if (err.originalError instanceof AuthenticationError) {
      return {
        message: err.message,
      };
    }

    return {
      message: err.message,
    };
  },
  resolvers,
  typeDefs,
});

const port = process.env.PORT || 4000;

server.listen({ port }).then(() => {
  console.log(`Server is running at http://localhost:${port}`);
});
