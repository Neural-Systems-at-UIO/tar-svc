const http = require('http');
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3001;

const app = require('express')();
// require cors
const cors = require('cors');
// use cors which allows all origins
app.use(cors({ origin: '*' }));

// import DZItoTar function
const DZItoTar = require('./slicing-web-tar.js').DZItoTar;
// create async endpoint to get DZI chunk
// accept all cors requests


// create a 
// app.get('/', (req, res) => {
// construct a json object which describes the dzi file
// const indexUrl = req.query.indexUrl;
// fetch(indexUrl).then((response) => {

// });
// start app
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
}
);
// serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
// demo api endpoint that reads a jpg and serves it without writing it
app.get('/demo', (req, res) => {
    // read file
    const file = fs.readFileSync('output_test.jpg');
    // send file in a format that can be viewed by the brwoser
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(file, 'binary');
});

function ReturnIndexAndSize(fileName, tarIndex) {
    file = tarIndex.map((line) => {
        if (line.startsWith(fileName)) {
            // return line and previous line
            return line;
        }
    });
    // remove empty lines 
    file = file.filter((line) => {
        return line != undefined;
    });
    if (file.length == 0) {
        return false;
    }
    // split line into array
    file = file[0].split(' ');
    fileIndex = file[1];
    fileSize = file[2];
    return [fileIndex, fileSize];
}
// get url of tar file
app.get('/dzi/', (req, res) => {
    // get filename, tarUrl and indexUrl from url
    const tarUrl = req.query.tarUrl;
    const fileName = req.query.fileName;
    const indexUrl = req.query.indexUrl;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    // fileName = 'output_image_files/14/4_10.jpg';
    // tarUrl = 'https://data-proxy.ebrains.eu/api/v1/permalinks/c708f5c2-75e7-4e51-bb9f-6175541b1cea';
    // indexUrl = 'https://data-proxy.ebrains.eu/api/v1/permalinks/b09aa4dc-4e9c-48eb-a246-4b1ed482c9ac';

    // get DZI chunk
    fetch(indexUrl).then(response => response.text()).then(tarindex => {
        // split indexfile.index into lines
        tarindex = tarindex.split('\n');
        // find where index starts with output_image_files/14/40_16.tif 
        fileIndexAndSize = ReturnIndexAndSize(fileName, tarindex);
        if (fileIndexAndSize == false) {
            res.send('File not found');
            return;
        }
        fileIndex = parseInt(fileIndexAndSize[0]);
        fileSize = parseInt(fileIndexAndSize[1]);
        console.log(fileIndex);
        console.log(fileSize);
        // read bytes from remote tar file at url

        fetch(tarUrl, {
            headers: {
                'content-type': 'multipart/byteranges',
                'Range': 'bytes=' + fileIndex + '-' + (fileIndex + fileSize)
            }
        }).then(response => {
            console.log('fetched');
            // fs write file
            // get reponse as binary
            response.arrayBuffer().then(ArrayBuff => {
                // convert to buffer
                const buffer = Buffer.from(ArrayBuff);
                // convert bufer to binary
                const file = buffer.toString('binary');
                // convert to png
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(file, 'binary');

            });
        });
    });
});
