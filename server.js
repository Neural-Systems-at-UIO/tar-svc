// build a simple express app that servers hello world
const express = require('express');
const app = express();
app.get('/', (req, res) => {
    res.send('Hello World!');
}
);
// listen on port 8080 
app.listen(8080, () => {
    console.log('Server running on port 8080');
}
);