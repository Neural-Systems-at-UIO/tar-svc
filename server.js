const http = require('http');
const fs = require('fs');
var express = require("express");
// require cors
const cors = require('cors');
// use cors which allows all origins
// import node fetch without esm
const fetch = require('node-fetch');
const { response } = require('express');
// import DZItoTar function
const DZItoTar = require('./slicing-web-tar.js').DZItoTar;
// import netunzip
const netunzip = require('./readZipHeader.js').netunzip;
// create async endpoint to get DZI chunk
// accept all cors requests
// convert the above line to non esm

var cachedIndexes = new Map();
var app = express();
app.use(cors({ origin: '*' }));





var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
// port = 8080;
// ip = '0.0.0.0';
// create a 
// app.get('/', (req, res) => {
// construct a json object which describes the dzi file
// const indexUrl = req.query.indexUrl;
// fetch(indexUrl).then((response) => {

// });
// start app
app.listen(port, ip);
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

function ReturnIndexAndSize(fileName, index) {
    file = index.map((line) => {
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
// function that will clear the cache of a specific url from the time it was called, can be reset by calling the function again
async function clearCache(url) {
    // delete the url from the cache after 30 minutes
    setTimeout(() => {
        cachedIndexes.delete(url);
    }, 1800000);
}

 



function retrieveIndex(url) {
    return new Promise((resolve, reject) => {
        if (cachedIndexes.has(url)) {
            // console.log('cache hit')
            zipIndex = cachedIndexes.get(url);
            resolve(zipIndex) 
        }  
        else {
            netunzip(url).then((zipIndex) => {
                // console.log('cache miss')
                // add zipIndex to cache
                cachedIndexes.set(url, zipIndex);
                resolve(zipIndex)
                clearCache(url);
            })
            .catch((error) => {
                reject(error)
                });
        }
});
}
app.get('/dzip/', (req, res) => {
    // get filename, dzipUrl from url
    const dzipUrl = req.query.dzipUrl;
    const fileName = req.query.fileName;
    dzip(dzipUrl, fileName, res)
    // check if dzipUrl is in cache
    // console.log('dzipUrl', dzipUrl)

});
function dzip(dzipUrl, fileName, res) {
    retrieveIndex(dzipUrl).then((zipIndex) => {
        file = zipIndex.entries.get(fileName)
        zipIndex.get(file).then((file) => {
            // console.log(file)
            // if filename ends with .dzi then we should return the dzi file
            if (fileName.endsWith('.dzi')) {
                // var dziFile = file.toString('utf8');
                // send file in a format that can be viewed by the browser
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                let buffer = Buffer.from(file);
    
                res.write(buffer);
                res.send();
            }
            // if filename ends with .jpg then we should return the jpg file
            else if (fileName.endsWith('.jpg')) {
                // console.log('jpg')
                // send file in a format that can be viewed by the browser
                // res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.set('Content-Type', 'image/jpeg');
                // convert file to buffer
                let buffer = Buffer.from(file);
                res.write(buffer);
                res.send();
            }
            // if filename ends with .png then we should return the png file
            else if (fileName.endsWith('.png')) {
                res.set('Content-Type', 'image/png');
                // convert file to buffer
                let buffer = Buffer.from(file);
                res.write(buffer);
                res.send();
                // res.end(file, 'binary');
            }
        });
    });
}
            

    // let fileIndex = file.offset;
    // let fileSize = file.compsize;
    
    // .then(response => {
    //     // fs write file
    //     // get reponse as binary
    //     response.arrayBuffer().then(ArrayBuff => {
    //         // convert to buffer
    //         const buffer = Buffer.from(ArrayBuff);
    //         // convert bufer to binary
    //         const file = buffer.toString('binary');

    //         // console log the file size in mb exactly
    //         console.log('file size in mb', file.length / 1000000);
    //         // convert to png
    //         res.writeHead(200, { 'Content-Type': 'image/png' });
    //         res.end(file, 'binary');

    //     });
    // });
    // // zipIndex is a map of filenames, find the filename in the map




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
    // if filename ends with .dzi then we should return the dzi file
    if (fileName.endsWith('.dzi')) {
        var dziFile = ''
        //  remove index.index from the indexUrl
        dziFile = indexUrl.replace('indexfile.index', '');
        // add the filename to the indexUrl
        dziFile = dziFile + fileName;
        // fetch the dzi file
        fetch(dziFile).then((response) => {
            // return the response as text
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            response.text().then((text) => {
                res.end(text);
                return;
            });

        });
    }
    else {
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
    };
});

app.get('/fakebucket/', (req, res) => {
    console.log('fakebucket')
    const url = req.query.url;
    fakeBucket(url, res);
});

// write a function to convert a json string into an xml
// function jsonToXml(json) {
//     var xml = '';
//     for (var prop in json) {
//         xml += json[prop] instanceof Array ? '' : "<" + prop + ">";
//         if (json[prop] instanceof Array) {
//             for (var array in json[prop]) {
//                 xml += "<" + prop + ">";
//                 xml += jsonToXml(new Object(json[prop][array]));
//                 xml += "</" + prop + ">";
//             }
//         } else if (typeof json[prop] == "object") {
//             xml += jsonToXml(new Object(json[prop]));
//         } else {
//             xml += json[prop];
//         }
//         xml += json[prop] instanceof Array ? '' : "</" + prop + ">";
//     }
//     var xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
//     // add container root element
//     return xml;
// }
// rewrite the above function so that it adds the attribute name to every element
// function jsonToXml(json) {
//     var xml = '';
//     for (var prop in json) {
//         xml += json[prop] instanceof Array ? '' : "<" + prop + " name='" + json[prop].name + "'>";
//         if (json[prop] instanceof Array) {
//             for (var array in json[prop]) {
//                 xml += "<" + prop + ">";
//                 xml += jsonToXml(new Object(json[prop][array]));
//                 xml += "</" + prop + ">";
//             }
//         } else if (typeof json[prop] == "object") {
//             xml += jsonToXml(new Object(json[prop]));
//         } else {
//             xml += json[prop];
//         }
//         xml += json[prop] instanceof Array ? '' : "</" + prop + ">";
//     }
//     var xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
//     // add container root element
//     return xml;
// }

// fix the function above so that the web browser no longer returns this error
// XML Parsing Error: not well-formed
// <?xml version="1.0" encoding="UTF-8"?>        <container><0
// ----------------------------------------------------------^
function jsonToXml(json) {
    let xml = '';
    for (let prop in json) {
        let tagName = typeof prop === "string" && /^[a-z]+$/i.test(prop) ? prop : `subdir`;
        if (typeof json[prop] == "object") {
        var value = (json[prop]);
        value = value.name;
        xml += json[prop] instanceof Array ? '' : `<${tagName} name="${value}">`;

        }
        else {
        xml += json[prop] instanceof Array ? '' : `<${tagName}>`;

        }
        
        if (json[prop] instanceof Array) {
            for (let i in json[prop]) {
                let tagName = `item`;
                xml += `<${tagName} attributeName=${json[prop][i]}'>`;
                xml += jsonToXml(new Object(json[prop][i]));
                xml += `</${tagName}>`;
            }
        } else if (typeof json[prop] == "object") {
            xml += jsonToXml(new Object(json[prop]));
        } else {
            xml += json[prop];
        }
        xml += json[prop] instanceof Array ? '' : `</${tagName}>`;
    }
    return xml;
}


function fakeBucket(url, res) {
    // if url ends with ?delimiter=/ then strip it
    if (url.endsWith('?delimiter=/')) {
        url = url.replace('?delimiter=/', '');
    
    url = url + '&delimiter=/'
    console.log('url   ' + url)
    return fetch(url).then(response => response.text())
    .then(response => {
        response = response;
        //  to object
        // convert to array buffer
        // response to string
        response = JSON.parse(response).objects;
        // get only the name of the files into an object with key 'name'
        response = response.map((item) => {
            // remove the path from the name
            item.name = item.name.split('/').pop();
            return { 'name': item.name }
        });
        // console.log(response)
        response = `<?xml version="1.0" encoding="UTF-8"?>        <container>${jsonToXml(response)} </container>`
        const buffer = Buffer.from(response);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.write(buffer);
        res.send();

    })
    }
    else {
        // if url ends with dzi then we need to make a call to our dzip method
        if (url.endsWith('dzi')) {
            // get the file name from the url
            var fileName = url.split('/').pop();
            // replace the dzi with dzip after the final . in the url
            url = url.replace('.dzi', '.dzip');

            
            
        }
        // if url ends with png, jpg, jpeg, or tif then we need to first restrucure the url
        if (url.endsWith('png') || url.endsWith('jpg') || url.endsWith('jpeg') || url.endsWith('tif')) {
            // url has format www.eg.eu/arbitrary/path/filename_files/0/0_0.png and we need to get filename.dzip
            let parts = url.split("_files");
            url = parts[0] + ".dzip";
            fileName = parts[0].split('/').pop();
            fileName = `${fileName}_files${parts[1]}`
        }
            
        // remove ?prefix= from the middle of the url
        url = url.replace('?prefix=', '/');
        // make a call to the dzip method
        dzip(url, fileName, res);
    }

}
