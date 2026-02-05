const cache = {};
const TTL = 60 * 60 * 1000; // 1 hour cache

function get(key) {
    const item = cache[key];
    if (item && item.expiry > Date.now()) {
        return item.value;
    }
    return null;
}

function set(key, value) {
    cache[key] = {
        value,
        expiry: Date.now() + TTL
    };
}

module.exports = { get, set };
