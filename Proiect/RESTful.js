const fs = require("fs");
const http = require("http");
const server = http.createServer().listen(8000);
console.log("listening on port 8000");

/*
customer = {
	id: 0, name: "", addr: "", zip: ""
};
*/
var customers = [];

function createCustomer(customer) {
	var i = customers.length;
	customers[i] = { id: i, name: customer.name, addr: customer.addr, zip: customer.zip };
	return customers[i];
}

function readCustomers() {
	copy = [];
	customers.forEach(e => {
		if(e)
			copy.push(e);
	});
	return copy;
}

function readCustomer(i) {
	if(i < customers.length && i >= 0 && customers[i])
		return { id: i, name: customers[i].name, addr: customers[i].addr, zip: customers[i].zip };
	return null;
}

function updateCustomer(i, customer) {
	if(i < customers.length && i >= 0 && customers[i]) {
		customers[i].name = customer.name;
		customers[i].addr = customer.addr;
		customers[i].zip = customer.zip;
		return customers[i];
	}
	return null; // return empty object to client
}

function deleteCustomer(i) {
	if(i < customers.length && i >= 0 && customers[i]) {
		var customer = customers[i];
		customers[i] = null;
		return customer;
	}
	return null;
}

server.on("request", function (request, response) {
	console.log(request.method + " " + request.url);
	if(request.method == "GET") {
		var path = request.url.substring(1, request.url.length).toLowerCase();
		if(path.length == 0)
			path = "index.html";
		if(path.substring(0, 4) == "api/") // GET CUSTOMER(S)
		{
			path = path.split("/");
			if(path.length >= 3 && path[1] == "customers" && !isNaN(path[2])) {
				var i = path[2];
				if(i < customers.length && i >= 0 && customers[i]) {
					response.writeHead(200, {"Content-Type":"application/json"});
					response.end(JSON.stringify(readCustomer(i)));
					return;
				}
			}
			else if(path.length >= 2 && path[1] == "customers") {
				response.writeHead(200, {"Content-Type":"application/json"});
				response.end(JSON.stringify(readCustomers()));
				return;
			}
			response.writeHead(404, {"Content-Type":"text/plain"});
			response.end(`404 - path ${request.url} not found`);				
		}
		else // RETURN A STATIC HTML FILE
		{
			fs.readFile(path, function (err, data) {
				if(!err) {
					response.writeHead(200, {"Content-Type":"text/html"});
					response.end(data.toString('utf8'));
				}
				else {
					response.writeHead(404, {"Content-Type":"text/plain"});
					response.end(`404 - path ${request.url} not found`);				
				}
			});
		}
	}
	else if(request.method == "POST") { // CREATE CUSTOMER
		var body = "";
		request.on("data", function (data) {
			body += data.toString();
		});
		request.on("end", function () {
			console.log(body);
			try {
				const path = request.url.toLowerCase().split("/");
				if(path.length >= 3 && path[1] == "api" && path[2] == "customers") { // check for the end point
					var cust = JSON.parse(body);
					if(cust.name && cust.addr && cust.zip) {
						response.writeHead(200, {"Content-Type":"application/json"});
						response.end(JSON.stringify(createCustomer(cust)));
						return;
					}
				}
			}
			catch {}
			response.writeHead(400, {"Content-Type":"text/plain"}); // BAD REQUEST
			response.end("400 - CLIENT ERROR: BAD REQUEST");
		});
	}
	else if(request.method == "PUT") { // UPDATE CUSTOMER
		const path = request.url.toLowerCase().split("/");
		var body = "";
		request.on("data", function (data) {
			body += data.toString();
		});
		request.on("end", function () {
			console.log(body);
			try {
				if(path.length >= 4 && path[1] == "api" && path[2] == "customers" && !isNaN(path[3]) && path[3] < customers.length && path[3] >= 0 && customers[path[3]]) {
					const cust = JSON.parse(body);
					if(cust.name && cust.addr && cust.zip) {
						response.writeHead(200, {"Content-Type":"application/json"});
						response.end(JSON.stringify(updateCustomer(path[3], cust)));
						return;
					}
					else {
						response.writeHead(400, {"Content-Type":"text/plain"}); // BAD REQUEST
						response.end("400 - CLIENT ERROR: BAD REQUEST");
					}
				}
				else {
					response.writeHead(404, {"Content-Type":"text/plain"});
					response.end(`404 - path ${request.url} not found`);				
				}
			}
			catch { // catch when the client send non-JSON data
				response.writeHead(400, {"Content-Type":"text/plain"}); // BAD REQUEST
				response.end("400 - CLIENT ERROR: BAD REQUEST");
			}
		});
	}
	else if(request.method == "DELETE") { // DELETE CUSTOMER
		const path = request.url.toLowerCase().split("/");
		if(path.length >= 4 && path[1] == "api" && path[2] == "customers" && !isNaN(path[3]) && path[3] < customers.length && path[3] >= 0 && customers[path[3]]) {
			response.writeHead(200, {"Content-Type":"application/json"});
			response.end(JSON.stringify(deleteCustomer(path[3])));
			return;
		}
		response.writeHead(404, {"Content-Type":"text/plain"});
		response.end(`404 - path ${request.url} not found`);				
	}
	else {
		response.writeHead(405, {"Content-Type":"text/plain"});
		response.end(`method ${request.method} not allowed`);
	}
});

