# Los internos de Node

## Código JavaScript que escribimos (100% JavaScript)

Aquí se encuentra todo el código JavaScript que escribimos en nuestros archivos para posteriormente ejecutar en la línea de comandos.


## NodeJS (50% JavaScript, 50% C++)

Cuando ejecutamos NodeJS en la línea de comandos, estamos invocando un proyecto de NodeJS. Tal cual como cualquier otro proyecto de JavaScript, NodeJS internamente tiene una colección de dependencias que utiliza para ejecutar el código. 2 de estas dependencias son V8 y libuv.


## V8 (30% JavaScript, 70% C++)

Es un motor de código abierto de JavaScript creado por Google. El propósito de este proyecto es el poder ejecutar código JavaScript afuera del navegador, Y esto es lo que hacemos cuando ejecutamos nuestro código JavaScript desde la terminal.


## libuv (100% C++)

Es un proyecto de C++ de código abierto que da acceso a Node a los sistemas de archivos subyacentes del sistema operativo. Nos da acceso a las redes, y también a manipular algunos aspectos de concurrencia


## ¿Cuál es el propósito de usar NodeJS?

NodeJS nos da una gran interfaz para usar y ejecutar nuestro código JavaScript convirtiéndolo en C++ que se ejecuta en nuestro computador para actualmente interpretar y ejecutar nuestro código JavaScript.


# Event Loop

- Se ejecuta nuestro código de JavaScript.
- Valida si hay algún setTimeout, setInterval o setImmediate pendiente.
- Valida si hay tareas de OS pendientes (como servidor escuchando en algún puerto).
- Validar si hay alguna tarea extensa de ejecución pendiente (como módulo fs).

Representación en pseudocódigo:

```javascript
// node myFile.js
const pendingTimers = [];
const pendingOSTasks = [];
const pendingOperations = [];

// New timers, tasks, operations are recorded from myFile running
myFile.runContents();

function shouldContinue() {
	// Check one: Any pending setTimeout, setInterval, setImmediate?
	// Check two: Any pending OS tasks? (Like server listening to port)
	// Check three: Any pending long running operations? (Like fs module)
	return pendingTimers.length || pendingOSTasks.length || pendingOperations.length;
}

// Entire body executes in one 'tick'
while(shouldContinue()) {
	// 1. Node looks at pendingTimers and sees if any functions are ready to be called. setTimeout, setInterval
	// 2. Node looks at pendingOSTasks and pendingOperations and calls relevant callbacks
	// 3. Pause execution. Continue when...
	//    - a new pendingOSTask is done
	//    - a new pendingOperation is done
	//    - a timer is about to complete
	// 4. Look at pendingTimers. Call any setImmediate
	// 5. Handle any 'close' events
}

// exit back to terminal
```


# ¿Es Node Single Threaded?

Aunque el Event Loop de Node es Single Threaded, esto no significa que nuestro código sea así, ya que se pueden implementar muchas cosas para hacer uso del Multi Threaded.

```javascript
const crypto = require("crypto");
const start = Date.now();

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
	console.log("1:", Date.now() - start);
});

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
	console.log("2:", Date.now() - start);
});

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
	console.log("3:", Date.now() - start);
});

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
	console.log("4:", Date.now() - start);
});

crypto.pbkdf2("a", "b", 100000, 512, "sha512", () => {
	console.log("5:", Date.now() - start);
});
```


## Libuv Thread Pool

Adicional al hilo usado por el Event Loop, libuv crea 4 Thread Pools para ejecutar tareas costosas. Esto ayuda a ejecutar todas estas tareas costosas computacionalmente usando Multi Threads en NodeJS.

### Cambiar el tamaño del Thread Pool
```javascript
process.env.UV_THREADPOOL_SIZE = 2;
```

| Pregunta | Respuesta |
|--|--|
| ¿Podemos usar el thread pool para código JavaScript o sólo se puede usar con funciones de NodeJS? | Podemos escribir JS personalizado que use el thread pool |
| ¿Qué funciones en la librería std de Node usan thread pool? | Todas las funciones del módulo 'fs'. Algunas cosas de 'crypto'. Depende del sistema operativo (windows vs unix based).
| ¿Cómo encaja este thread pool en el Event Loop? | Las tareas ejecutándose en el thread poll son las 'pendingOperations' en el código de ejemplo |
| ¿Qué funciones en la librería std de Node usan las características async de los sistemas operativos? | Caso todo sobre redes para todos los sitemas operativos. Algunas otras cosas específicas del SO |
| ¿Cómo encajan todas estas features de SO en el Event Loop? | Las tareas usando el SO por debajo están reflejadas en nuestro arreglo 'pendingOSTasks' |


# Mejorar el rendimiento de Node

Cuando es inviable ajustar el rendimiento directamente en el Event Loop, podemos tomar esta alternativa que nos brinda 2 caminos:

- Usar Node en modo Cluster.
- Usar Worker Threads.

Cuando desarrollamos con clusters y threads es recomendado no usar nodemon o una librería que refresque los cambios de forma automática ya que puede ser problemático. Lo mejor es bajar y volver a levantar el servidor por nuestra propia cuenta.


## Modo cluster

El Cluster Manager puede crear, reiniciar y eliminar instancias, también puede enviarles información, entre otras cosas.

```javascript
const cluster = require("cluster");

console.log(cluster.isMaster);

// Agregar nuevo hijo
cluster.fork();
```

Hacer todo con el Cluster Manager puede llegar a ser difícil y confuso, es por esto que una buena opción es usar PM2 para hacer este manejo de una forma mucho más sencilla. Para instalarlo podemos ejecutar el siguiente comando:

```bash
npm i -g pm2
```

| Comando | Explicación |
|--|--|
| `pm2 start index.js -i 0` | Ejecutar nuestro archivo con pm2 |
| `pm2 list` | Ver los clusters |
| `pm2 show index` | Ver más información sobre estos hijos |
| `pm2 monit` | Muestra unos gráficos con una información de monitoreo |
| `pm2 delete index` | Elimina todos los hijos de index |

La bandera `-i` le da el poder a pm2 de decidir cuantas instancias crear.


## Webworker Threads

Debemos ser cuidadosos, el hecho de usar esto junto con el modo cluster no garantiza que nuestro rendimiento vaya a aumentar mucho. Es por esto que debemos ser precavidos y no abusar del uso de estas cosas. Para hacer uso de los Webworker Threads podemos instalar el siguiente paquete:

```bash
npm i webworker-threads --ignore-script
```

Para comunicar el hilo principal con nuestros Workers tenemos el postMessage (enviar mensaje), y el onmessage (recibir mensaje).


# Data caching con Redis

Muchas veces tenemos muchas consultas en nuestro frontend hacia nuestro backend, y esto puede cargar de manera sustancial nuestra aplicación, es por esto que el data caching es bueno, ya que nos permite evitar hacer repetidas veces estas consultas cacheando sus resultados.

```javascript
const redis = require("redis");
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

// Setear un valor llave:value
client.set("hi", "there");

// Setear con un tiempo de expiración de 10 segundos
client.set(key, JSON.stringify(result), "EX", 10);

// Obtener valor
client.get("hi", (err, val) => console.log(val));

// Setear keys anidadas
client.hset("spanish", "red", "rojo");

// Obtener valor con keys anidadas
client.hget("spanish", "red", (err, val) => console.log(val));
```

No se pueden guardar objetos de JavaScript directamente, para hacerlo debemos usar `JSON.stringify` al momento de guardar los registros, y `JSON.parse` para leer el valor.

Para hacer el caching lo que se puede aplicar es en el key guardar el query que se está ejecutando, y en el value el resultado de la ejecución de dicho query.

Si queremos evitar usar los callbacks y volver los llamados una promesa, podemos hacerlo de la siguiente forma:

```javascript
const redis = require("redis");
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
const util = require("util");

client.get = util.promisify(client.get);

const cachedBlogs = await  client.get(req.user.id);

// Eliminar todas las entries en Redis
client.flushall();
```

## Problemas comunes

| Problema | Solución |
|--|--|
| El código cacheado no es fácilmente reusable en otra parte de nuestro código base | Hook en la generación y ejecución del query de Mongoose |
| Los valores de caché nunca expiran | Agregar valores timeados asignados a Redis. También agregar la opción de reiniciar todos los valores luego de un evento específico |
| Las llaves cacheadas no funcionarán cuando se introduce otra colección u opciones de query | Plantear una solución más robusta para generar las llaves de caché |


## Crear key usando el nombre de la colección y el id del usuario

Es importante tener en cuenta que los objetos siempre son pasados por referencia, por lo que es indispensable usar funciones como `Object.assign`.

```javascript
const key  = Object.assign({}, this.getQuery(), {
	collection: this.mongooseCollection.name
});
```

Ahora mismo tenemos un problema con el caching, y es que no logramos identificar qué elementos borrar cuando se agrega uno nuevo a nuestra base de datos. Por ejemplo, si el usuario 1 agrega un nuevo Blog, no sabemos cómo identificarlo para borrar todos los registros asociados a él y así poder limpiar el caching únicamente para los registros de este usuario, pero para ello podemos usar los Nested Hashes.

```javascript
// Rutas
app.post('/api/blogs', requireLogin, cleanCache, async(req, res) => {
	const { title, content } = req.body;

	const blog = new Blog({
		title,
		content,
		_user: req.user.id
	});

	try {
		await blog.save();
		res.send(blog);
	} catch (err) {
		res.send(400, err);
	}
});

// Middleware
const { clearHash } = require('../services/cache');

module.exports = async(req, res, next) => {
	await next();

	clearHash(req.user.id);
}

// Archivo para caching
const mongoose = require("mongoose");
const redis = require("redis");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache  =  function(options  = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key  ||  "");

	return this;
}

mongoose.Query.prototype.exec  =  async  function() {
	if (!this.useCache) {
		return exec.apply(this, arguments);
	}

	console.log("I'M ABOUT TO RUN A QUERY");

	console.log(this.getQuery());
	console.log(this.mongooseCollection.name);

	const key = Object.assign({}, this.getQuery(), {
		collection: this.mongooseCollection.name
	});

	// See if we have a value for "key" in redis
	const cacheValue = await  client.hget(this.hashKey, key);

	// If we do, return that
	if (cacheValue) {
		const doc = JSON.parse(cacheValue);

		Array.isArray(doc) ?
			doc.forEach(d => new this.model(d)) :
			new this.model(doc);
	}

	// Otherwise, issue the query and store the result in redis
	const result = await exec.apply(this, arguments);

	// Expiration in seconds
	client.hset(this.hashKey, key, JSON.stringify(result), "EX", 10);

	return  result;
}

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey));
	}
}
```

