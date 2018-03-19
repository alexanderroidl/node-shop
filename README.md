Fakedoors Shop Server
===

## Dependencies

* [Node](https://nodejs.org)
* [MySQL](https://www.mysql.com)
* Optional:
	* [Compass](http://compass-style.org/) (To edit PDF generators SASS stylesheet)

## MySQL
* Configuration: ```app/cfg/mysql.js```
* Node will create database automatically

## Run server, run!
``` bash
# install dependencies
npm install

# start server
npm start

# start server (re-create database)
npm start safe
```

## Generator
**Configuration:** ```/app/cfg/generator.js```
``` bash
# generate products and users
npm run generate

# clear database
npm run emptydb

# re-create database
npm run resetdb

# create root user
npm run root
```

## Requests
##### [Postman](https://www.getpostman.com/) collection: ```/Fakedoors.postman_collection.json``` (Examples for every request)
##### All responses look like this:
``` bash
{
	success: [bool],
	(message: [string],)
	data: [mixed]
}
```
**POST** (HEADER ```Content-Type: x-www-form-urlencoded```)
* **Public**
	``` bash
	# Login returns token to use for protected requests
	/login # (username/email)[password]
	/register # [username][email][password][password_repeat][firstName][lastName]([clientHash])
	```
* **Protected** (Header *x-access-token*)
	``` bash
	/addresses/add # (first_name)(last_name)[street][street_nr][city][zip][planet][dimension](additional)
	/paymethods/add # [type][data]
	/purchase/new # [paymethod_id][address_id][data](preview)
	```
	* **Admin**
		``` bash
		/products/add # [name][full_name][price][description][image_path][quantity]
		```
**GET**
* **Public**
	```
	/products/[page]
	/product/[id]
	```
* **Protected** (Header *x-access-token* required)
	```
	/account
	/addresses
	/paymethods

	/purchases
	/purchase/[id]
	/purchase/[id]/pdf
	```
---
*“Forty-two,” said Deep Thought, with infinite majesty and calm.*
