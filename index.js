require("dotenv").config();
const http = require("http");
const url = require("url");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { connectDB, getConnection } = require("./db");
const { sendJson, parseBody } = require("./utils");

const SECRET = process.env.SECRET || "ClaveSecretaBarberiaJWT";
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();
    
    const server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const path = parsedUrl.pathname;

      // CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        return res.end();
      }

      try {
        const connection = await getConnection();

        // RUTA BASE
        if (path === "/api" && req.method === "GET") {
          return sendJson(res, { mensaje: "Servidor con SQLite activo ✅" });
        }

        // REGISTRO
        if (path === "/api/registro" && req.method === "POST") {
          const { nombre, apellido, dni, email, password } = await parseBody(req);

          if (!nombre || !apellido || !dni || !email || !password) {
            return sendJson(res, { mensaje: "Faltan datos" }, 400);
          }

          const existe = await connection.all(
            "SELECT * FROM usuarios WHERE Email = ?",
            [email]
          );

          if (existe.length > 0) {
            return sendJson(res, { mensaje: "El usuario ya existe" }, 400);
          }

          const hashed = await bcrypt.hash(password, 10);

          const result = await connection.run(
            "INSERT INTO usuarios (Nombre, Apellido, DNI, Email, Contrasenia, Fecha) VALUES (?, ?, ?, ?, ?, datetime('now'))",
            [nombre, apellido, dni, email, hashed]
          );

          const token = jwt.sign(
            { id: result.lastID, email, nombre, apellido, dni },
            SECRET,
            { expiresIn: "3h" }
          );

          // 🔥 ENVIA TODOS LOS DATOS
          return sendJson(res, {
            mensaje: "Registro exitoso",
            token,
            usuario: { 
              id: result.lastID, 
              email, 
              nombre,
              apellido,  // 🔥 AGREGA ESTO
              dni        // 🔥 AGREGA ESTO
            },
          });
        }

        // LOGIN
        if (path === "/api/login" && req.method === "POST") {
          const { email, password } = await parseBody(req);

          const rows = await connection.all(
            "SELECT * FROM usuarios WHERE Email = ?",
            [email]
          );

          if (rows.length === 0) {
            return sendJson(res, { mensaje: "Usuario no encontrado" }, 404);
          }

          const user = rows[0];
          const valid = await bcrypt.compare(password, user.Contrasenia);
          if (!valid) {
            return sendJson(res, { mensaje: "Contraseña incorrecta" }, 401);
          }

          const token = jwt.sign(
            { id: user.id, email: user.Email, nombre: user.Nombre, apellido: user.Apellido, dni: user.DNI },
            SECRET,
            { expiresIn: "3h" }
          );

          // 🔥 ENVIA TODOS LOS DATOS
          return sendJson(res, {
            mensaje: "Login exitoso",
            token,
            usuario: {
              id: user.id,
              email: user.Email,
              nombre: user.Nombre,
              apellido: user.Apellido,  // 🔥 AGREGA ESTO
              dni: user.DNI             // 🔥 AGREGA ESTO
            },
          });
        }

        // OBTENER USUARIOS
        if (path === "/api/usuarios" && req.method === "GET") {
          const usuarios = await connection.all(
            "SELECT id, Nombre, Apellido, Email, DNI, Fecha FROM usuarios"
          );
          return sendJson(res, { usuarios });
        }

        return sendJson(res, { mensaje: "Ruta no encontrada" }, 404);
      } catch (err) {
        console.error("Error general:", err.message);
        return sendJson(res, { error: err.message }, 500);
      }
    });

    server.listen(PORT, () => {
      console.log(`✅ Servidor con SQLite corriendo en http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error("❌ No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
}

startServer();