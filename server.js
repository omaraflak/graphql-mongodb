var express = require('express');
var graphqlHTTP = require('express-graphql');
var { GraphQLSchema, GraphQLNonNull, GraphQLInt, GraphQLList, GraphQLString, GraphQLObjectType } = require('graphql');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017";

MongoClient.connect(url, function(err, db){
    var dbo = db.db("mydb");
    var users = dbo.collection("users");

    // define user type
    const userType = new GraphQLObjectType({
        name: 'user',
        fields: {
            _id: { type: GraphQLString },
            name: { type: GraphQLString },
            age: { type: GraphQLInt},
        }
    });

    // create schema ans resolve functions
    var schema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'Query',
            fields: {
                // query all users
                users: {
                    type: new GraphQLList(userType),
                    resolve: async () => {
                        return await users.find().toArray();
                    }
                },
                // query user by _id
                user: {
                    type: userType,
                    args: {
                        _id: { type: new GraphQLNonNull(GraphQLString) }
                    },
                    resolve: async (rootValue, {_id}) => {
                        return await users.findOne(new ObjectId(_id));
                    }
                }
            }
        }),
        mutation: new GraphQLObjectType({
            name: 'Mutation',
            fields: {
                // create user
                createUser: {
                    type: userType,
                    args: {
                        name: { type: new GraphQLNonNull(GraphQLString) },
                        age: { type: new GraphQLNonNull(GraphQLInt) }
                    },
                    resolve: async (rootValue, args) => {
                        return (await users.insertOne(args)).ops[0];
                    }
                }
            }
        })
    });

    // start graphql server
    var app = express();
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        graphiql: true,
    }));

    app.listen(4000, () => console.log('Now browse to http://localhost:4000/graphql'));

});
