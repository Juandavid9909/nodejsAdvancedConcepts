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
myFile.runCOntents();

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

- Usar Node en modo Cluster (recomendado).
- Usar Worker Threads (experimental).

Cuando desarrollamos con clusters y threads es recomendado no usar nodemon o una librería que refresque los cambios de forma automática ya que puede ser problemático. Lo mejor es bajar y volver a levantar el servidor por nuestra propia cuenta.


## Modo cluster

El Cluster manager puede crear, reiniciar y eliminar instancias, también puede enviarles información, entre otras cosas.

```javascript
const cluster = require("cluster");

console.log(cluster.isMaster);
```

