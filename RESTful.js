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
In this example code, AJAX is used to access the REST API implemention of the Node.js server. Notice that this is not code written with an emphasis on compatibility. Some fat has been trimmed to make the code more succinct.

example #2
<!DOCTYPE html>
<html lang="en">
<head>
	<title>REST API EXAMPLE</title>
	<style>
		body {
			margin: 0;
			padding: 0;
		}
		#edit {
			position: absolute;
			display: none;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: #fff;
		}
		#edit:target {
			display: block;
		}
	</style>
	<script type="text/javascript">
	function connect(method, action, body, callback) {
		xmlobj = new XMLHttpRequest();
		xmlobj.onreadystatechange = function () {
			if (xmlobj.readyState == 4) {
				if (xmlobj.status == 200) {
					if(callback) {
						callback(JSON.parse(xmlobj.responseText));
					}
					return;
				}
				alert(xmlobj.status, xmlobj.statusText);
			}
		};
		xmlobj.open(method, action, true);
		if(body) {
			xmlobj.setRequestHeader("Content-Type", "application/json");
		}
		xmlobj.send(body);
	}
	var custIdEdit;
	function addCustToDoc(e) {  // ADD CUSTOMER TO HTML DOCUMENT
		div = document.createElement("div");
		div.setAttribute("custid", e.id);
		// CREATE EDIT CUSTOMER BUTTON
		var a = document.createElement("a");
		a.innerText = "edit";
		a.href = "#edit";
		a.onclick = function () {
			custIdEdit = this.parentElement.getAttribute("custid");
			connect("GET", "/api/customers/" + custIdEdit, null, function (custObj) {
				var form = document.getElementById("updateForm");
				form.name.value = custObj.name;
				form.addr.value  = custObj.addr;
				form.zip.value  = custObj.zip;
			});
		};
		div.appendChild(a);
		div.appendChild(document.createTextNode(" "));
		// CREATE DELETE CUSTOMER BUTTON
		a = document.createElement("a");
		a.innerText = "delete";
		a.href = "#";
		a.onclick = function () {
			var action = "/api/customers/" + this.parentElement.getAttribute("custid");
			connect("DELETE", action, null, function () {
				readCustomers();
			});
			return false;
		 };
		div.appendChild(a);
		div.appendChild(document.createTextNode(" "));
		var span = document.createElement("span");
		span.innerText = e.name;
		div.appendChild(span);
		document.getElementById("customers").appendChild(div);
	}
	function submitCreateForm(form) {
		var body = JSON.stringify({ name: form.name.value, addr: form.addr.value, zip: form.zip.value });
		connect("POST", "/api/customers", body, function (custObj) {
			if(custObj) {
				addCustToDoc(custObj);
				form.reset();
			}
		});
		return false;
	}
	function submitUpdateForm(form) {
		var action = "/api/customers/" + custIdEdit;
		var body = JSON.stringify({ name: form.name.value, addr: form.addr.value, zip: form.zip.value })
		connect("PUT", action, body, function () {
			readCustomers();
			location.href = "#!";
		});
		return false;
	}
	function readCustomers () {
		connect("GET", "/api/customers", null, function (custArray) {
			var custs = document.getElementById("customers");
			while(custs.childNodes.length > 0) {
				custs.removeChild(custs.childNodes[0]);
			}
			custArray.forEach(e => {
				addCustToDoc(e);
			});
		});
	}
	window.addEventListener("load", readCustomers, false);
	</script>
</head>
<body>
	<fieldset>
		<legend>Create Customer</legend>
		<form onsubmit="return submitCreateForm(this);">
		<input type="text" name="name" placeholder="enter name" required /><br />
		<input type="text" name="addr" placeholder="enter address" required /><br />
		<input type="text" name="zip" placeholder="enter zip" required /><br />
		<input type="submit" />
		</form>
	</fieldset>
	<div id="customers"></div>
	<div><a href="javascript:readCustomers();">REFRESH</a></div>
	<div id="edit">
		<fieldset>
			<legend>Edit Customer</legend>
			<form onsubmit="return submitUpdateForm(this);" id="updateForm">
			<input type="text" name="name" placeholder="enter name" required /><br />
			<input type="text" name="addr" placeholder="enter address" required /><br />
			<input type="text" name="zip" placeholder="enter zip" required /><br />
			<input type="submit" /> <a href="#!">CLOSE</a>
			</form>
		</fieldset>
	</div>
</body>
</html>