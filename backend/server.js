const secret = "superSecretStringForJWT"; // move to .env file

// required modules
const fastify = require("fastify")({ logger: true }); // Require the framework and instantiate it
const path = require("node:path");

const pong_server = require("./pong_server");

// Register the plugins
fastify.register(require("@fastify/websocket"));
fastify.register(require("./plugins/sqlite-connector"));
fastify.register(require("@fastify/jwt"), {
	secret: secret,
});
fastify.register(require("./plugins/authenticate_jwt"));

// fastify.register(require("@fastify/static"), {
// 	root: path.join(__dirname, "..", "uploads"),
// 	prefix: "/uploads/", // optional: default '/'
// });

fastify.register(require("@fastify/formbody")); // parse x-www-form-urlencoded bodies
fastify.register(require("@fastify/multipart")); // parse multipart/form-data bodies (picture upload)

//subfiles for routes
fastify.register(require("./auth_routes").routes);
fastify.register(require("./user_routes").routes);
fastify.register(require("./history_routes").routes);

// websocket chat route
fastify.register(require("./chat").chat);

// game websocket route
fastify.register(require("./game_management").game_management);

// Fallback to index.html for unknown routes (SPA support)
fastify.setNotFoundHandler((req, reply) => {
	return reply.sendFile("index.html");
});

fastify.register(require("@fastify/static"), {
	root: path.join(__dirname, "..", "frontend"),
	//prefix: "/public/", // optional: default '/'
});

// Run the server!
fastify.listen({ port: 3000 /*host: "0.0.0.0"*/ }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
