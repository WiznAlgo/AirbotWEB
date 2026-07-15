// Entry point khusus Vercel. Vercel otomatis menjadikan file di folder /api
// sebagai serverless function. Express app itu sendiri sudah kompatibel
// sebagai request handler (app(req, res)), jadi cukup di-export langsung -
// tidak perlu (dan tidak boleh) memanggil app.listen() di sini.
import app from "../server/app.js";

export default app;
