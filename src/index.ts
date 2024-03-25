import * as http from "http";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import * as mime from "mime-types";
import { randomInt } from "node:crypto";
import { Songs, DataMusic } from "./songs.types";
import settings from "./settings";
import { songService } from "./song.service";

const server = http.createServer(
  async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url?.startsWith("/api/songs")) {
      handleSongsAPIRequests(req, res);
    } else {
      handleStaticFileRequests(req, res);
    }
  }
);

function handleSongsAPIRequests(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  switch (req.method) {
    case "GET":
      handleGetSongs(req, res);
      break;
    case "POST":
      handleCreateSong(req, res);
      break;
    case "PATCH":
    case "PUT":
      handleUpdateSong(req, res);
      break;
    case "DELETE":
      handleDeleteSong(req, res);
      break;
    default:
      serveError(res, 400, "Bad request");
  }
}

async function handleGetSongs(req: http.IncomingMessage, res: http.ServerResponse) {
  const songId = req.url?.split("/")[3]

  if (!songId) {
    fs.readFile(settings.SONGS_FILE_PATH, "utf8", (err, data) => {
      if (err) {
        return serveError(res, 500, err.message);
      }
      const songs = JSON.parse(data).songs;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, data: songs }));
    });
  } else {
    if (isNaN(+songId)) {
      return serveError(res, 400, "Invalid id")
    }
    const songFound = await songService.getSongById(+songId)

    if (!songFound) {
      return serveError(res, 404, "Song not found")
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, data: songFound }));

  }
}

function handleCreateSong(req: http.IncomingMessage, res: http.ServerResponse) {
  const pathSongs = /^\/api\/songs$/; // "/songs"
  const urlReq = req.url || "/";

  if (pathSongs.test(urlReq) && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const content = await fsp.readFile(settings.SONGS_FILE_PATH, "utf8");
        const music: { songs: DataMusic[] } = JSON.parse(content);
        const newSong: Songs = JSON.parse(body);
        const newId = randomInt(1000);
        music.songs.push({ id: newId, ...newSong });
        await fsp.writeFile(
          settings.SONGS_FILE_PATH,
          JSON.stringify(music, null, 2)
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        const songs = JSON.stringify({ ok: true, data: music.songs }, null, 2);
        res.end(songs);
      } catch (error) {
        console.log(error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    });
  }
}

// serveError(res, 501, 'Not implemented');

async function handleUpdateSong(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const songId = req.url?.split("/")[3]

  if (!songId) {
    return serveError(res, 400, "Invalid id")
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const updateSongBody: Songs = JSON.parse(body);
      const result = await songService.updateSong(+songId, updateSongBody)

      if (!result) return serveError(res, 400, "Can't deleted this song")
      const updatedSong = await songService.getSongById(+songId)

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, data: updatedSong }));
    } catch (error) {
      console.error(error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  });

}

async function handleDeleteSong(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const songId = req.url?.split("/")[3]

  if (!songId) {
    return serveError(res, 400, "Invalid id")
  }

  if (isNaN(+songId)) {
    return serveError(res, 400, "Invalid id")
  }

  const deleted = await songService.deleteSong(+songId)

  if (!deleted) {
    return serveError(res, 400, "Can't deleted this song")
  }

  res.writeHead(204, { "Content-Type": "application/json" });
  res.end();
}

function handleStaticFileRequests(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const filePath = path.join(settings.PUBLIC_DIR, req.url!);
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === "ENOENT") {
        return serve404Page(res);
      } else {
        return serveError(res, 500, err.message);
      }
    }

    if (stats.size > settings.MAX_FILE_SIZE) {
      return serveFileWithStream(res, filePath);
    } else {
      return serveFileWithReadFile(res, filePath);
    }
  });
}

function serveFileWithStream(res: http.ServerResponse, filePath: string) {
  const fileStream = fs.createReadStream(filePath);

  fileStream.on("open", () => {
    res.writeHead(200, {
      "Content-Type": getContentType(filePath),
    });
    fileStream.pipe(res);
  });

  fileStream.on("error", (err) => {
    serveError(res, 500, err.message);
  });
}

function serveFileWithReadFile(res: http.ServerResponse, filePath: string) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      serveError(res, 500, err.message);
      return;
    }
    res.writeHead(200, {
      "Content-Type": getContentType(filePath),
    });
    console.log(data);
    res.end(data);
  });
}

function serve404Page(res: http.ServerResponse) {
  const filePath404 = path.join(settings.PUBLIC_DIR, "404.html");
  fs.readFile(filePath404, (err, data) => {
    if (err) {
      return serveError(res, 500, err.message);
    }
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(data);
  });
}

function serveError(
  res: http.ServerResponse,
  statusCode: number,
  message: string
) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

function getContentType(filePath: string): string {
  const contentType = mime.contentType(path.extname(filePath));
  return contentType || "application/octet-stream";
}

server.listen(settings.PORT, () => {
  console.log(`Servidor escuchando en el puerto ${settings.PORT}`);
});
