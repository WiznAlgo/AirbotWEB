// Entry point untuk jalan sebagai proses biasa: lokal (npm run dev / npm start)
// atau VPS/Pterodactyl. Untuk Vercel, entry point-nya ada di api/index.js
// (tidak pakai app.listen, karena Vercel yang mengatur siklus request-nya).
import app from "./app.js";

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`[PANEL] server jalan di http://localhost:${PORT}`);
});
