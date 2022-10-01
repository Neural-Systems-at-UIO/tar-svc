const fs = require('fs');
// open indexfile.index 
index = fs.readFileSync('indexfile.index', 'utf8');
// split indexfile.index into lines
index = index.split('\n');
// find where index starts with output_image_files/14/40_16.tif with map
file = index.map((line) => {
    if (line.startsWith('output_image_files/14/4_10.jpg')) {
        // return line and previous line
        return line;
    }
});
// remove empty lines 
file = file.filter((line) => {
    return line != undefined;
});
// split line into array
file = file[0].split(' ');
fileIndex = file[1];
fileSize = file[2];
console.log(fileIndex);
console.log(fileSize);
// convert to integer
fileIndex = parseInt(fileIndex);
fileSize = parseInt(fileSize);


// open tar file as stream
const stream = fs.createReadStream('output_image_files.tar', {
    start: fileIndex,
    end: fileIndex + fileSize
});
// create write stream
const writeStream = fs.createWriteStream('output_test.jpg');
// pipe stream to write stream
stream.pipe(writeStream);