export function writeCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Allow-Headers", "*")
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
}

export function writeJson(response, status, value) {
  writeCors(response)
  response.writeHead(status, { "content-type": "application/json" })
  response.end(JSON.stringify(value))
}
