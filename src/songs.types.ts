export interface Songs {
    title: string;
    artist: string;
    album: string;
    year: number;
    genre: string;
}
export interface DataMusic extends Songs {
    id: number;
}

export interface SongUpdate {
    title?: string,
    artist?: string,
    album?: string,
    year?: number,
    genre?: string
}
