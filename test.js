// get node-fetch
const fetch = require('node-fetch');
// an api test that calls the api and checks the response
let endpoint = 'http://localhost:8080/fakebucket'

let query = "?url=https://data-proxy.ebrains.eu/api/v1/buckets/space-for-testing-the-nutil-web-applicat?prefix=.nesysWorkflowFiles/zippedPyramids/71591511?delimiter=/"

let headers = {
    'Content-Type': 'application/json',
}

fetch(endpoint + query, {
    method: 'GET',
    headers: headers,
})
.then(response => response.json())
.then(data => {
    console.log(data)
}
)