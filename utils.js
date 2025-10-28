const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET || "ClaveSecretaBarberiaJWT";

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Error al parsear el cuerpo JSON"));
      }
    });
  });
}

function requireAuth(req, res, callback) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: "Token requerido" }));
  }

  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, SECRET);
    callback(user);
  } catch (err) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: "Token inválido o expirado" }));
  }
}

module.exports = { sendJson, parseBody, requireAuth };