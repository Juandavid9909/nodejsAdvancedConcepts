const mongoose = require("mongoose");
const redis = require("redis");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || "");

    return this;
}

mongoose.Query.prototype.exec = async function() {
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
    const cacheValue = await client.hget(this.hashKey, key);

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

    return result;
}

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}