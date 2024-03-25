import fs from "node:fs/promises"
import settings from "./settings"
import { 
    DataMusic as SongData, 
    Songs as SongCreate, 
    SongUpdate 
} from "./songs.types"

export const songService = {
    async getAllSong(): Promise<SongData[]> {
        const data = await fs.readFile(settings.SONGS_FILE_PATH, "utf-8");
        const { songs }: { songs: SongData[] } = await JSON.parse(data)
        return songs
    },
    async getSongById(id: number): Promise<SongData | undefined> {
        const songs = await this.getAllSong()
        return songs.find(s => s.id === id)
    },
    async addSong(data: SongCreate): Promise<SongData | undefined> {
        const songs = await this.getAllSong()
        const id = songs[songs.length - 1].id + 1
        songs.push({ id, ...data })
        await fs.writeFile(settings.SONGS_FILE_PATH, JSON.stringify({ songs }, null, 2))
        return await this.getSongById(id)
    },

    async updateSong(id: number, data: SongUpdate) {
        const song = await this.getSongById(id)
        if (!song) {
            return false
        }
        const songs = await this.getAllSong()
        const updateData = songs.map(song => {
            if (song.id === id) {
                return { ...song, ...data }
            } else {
                return song
            }
        })
        await fs.writeFile(
            settings.SONGS_FILE_PATH, 
            JSON.stringify({ songs: updateData }, null, 2))
        return true
    },

    async deleteSong(id: number): Promise<boolean> {
        const song = await this.getSongById(id)
        if (!song) {
            return false
        }
        const songs = await this.getAllSong()
        const updateData = songs.filter(song => song.id !== id)
        await fs.writeFile(settings.SONGS_FILE_PATH, 
            JSON.stringify({ songs: updateData }, null, 2))
        return true
    }
}
