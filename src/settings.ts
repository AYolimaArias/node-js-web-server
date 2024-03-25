import path from "path"

export default {
    PORT: process.env["PORT"] || 3001,
    PUBLIC_DIR: path.join(__dirname, '..', "public"),
    SONGS_FILE_PATH: path.join(__dirname, '..', 'songs.json'),
    MAX_FILE_SIZE: 4194304, // 4MB en bytes
}