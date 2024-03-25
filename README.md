# Project: Multipurpose Web Server

El proyecto consiste en crear un servidor web multipropósito que sirva archivos estáticos asi como una web API para obtener información de canciones categorizadas por artista y género musical.

## Servidor Web de archivos estáticos

El servidor deberá ser capaz de servir archivos estáticos ubicados en la carpeta `public` del proyecto. Para que una solicitud sea válida deberá utilizar el método `GET` y apuntar a la url de un archivo existente incluyendo su extensión: `/ruta/del/archivo.ext`.

El servidor deberá cumplir las siguientes características:

- Debe retornar una respuesta con código de estado 200 en caso de encontrar el archivo solicitado
- Debe incluir la cabecera "Content-Type" adecuada según la extensión del archivo solicitado
- En caso no exista el archivo, deberá retornar una respuesta con código de estado 404 y servir el documento `404.html` con un mensaje de error personalizado para el usuario. <a href="https://webflow.com/blog/best-404-pages" target="_blank">Aquí algunas referencias</a>.
- Para otros problemas, deberá retornar una respuesta con código de estado 500 cuyo cuerpo deberá ser un string JSON con la forma: `{ error: [mensaje de error] }`.
- Los archivos mayores a 4MB (4 194 304 bytes) deberán servirse usando streams. Los archivos más pequeños deberán servirse usando `fs.readFile`.

### Requerimiento opcional

El servidor deberá soportar la presencia de la cabecera `"range"` en el request. Esta cabecera indica que el cliente no está solicitando todo el archivo sino una parte (chunk) del mismo. Esta cabecera habilita la comunicación entre cliente y servidor para el "streaming" de audio y video donde el cliente puede empezar a reproducir el contenido sin tener que esperar que todo el archivo sea retornado por el servidor. Las etiquetas `<video>`, `<audio>` y los navegadores modernos envían la cabecera `"range"` al servidor.

Su tarea será averiguar cómo funciona este mecanismo e implementarlo en su servidor de archivos estáticos. <a href="https://medium.com/@vishal1909/how-to-handle-partial-content-in-node-js-8b0a5aea216" target="_blank">Aquí una referencia</a> sobre este punto. Pueden encontrar más información bajo el concepto de "Partial Content" en el contexto de servidores web.

## Music API

El servidor también alojará una web API para gestionar una lista de canciones populares. La capa de persistencia de datos utilizará un archivo JSON llamado `songs.json` con la siguiente estructura:

```json
{
  "songs": [
    {
      "id": 1,
      "title": "Shape of You",
      "artist": "Ed Sheeran",
      "album": "÷ (Divide)",
      "year": 2017,
      "genre": "Pop"
    },
    // ... más canciones
  ]
}
```

Todos los endpoints para la gestión de canciones estarán disponibles partiendo desde la ruta `api/`. Aquí la descripción de cada ruta que la API debe soportar:


| método    | ruta         | body                                                                                                                        | descripción                                                                                     |
| --------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| GET       | api/songs    |                                                                                                                             | Obtiene la lista completa de canciones                                                          |
| POST      | api/songs    | \{<br />  title: string,<br />  artist: string,<br />  album: string,<br />  year: number,<br />  genre: string<br />}      | Crea una canción                                                                                |
| GET       | api/song/:id |                                                                                                                             | Obtiene la canción con id === :id                                                               |
| PATCH/PUT | api/song/:id | \{<br />  title?: string,<br />  artist?: string,<br />  album?: string,<br />  year?: number,<br />  genre?: string<br />} | Edita la canción con id === :id sobrescribiendo <br />sus atributos con los enviados en el body |
| DELETE    | api/song/:id |                                                                                                                             | Elimina la canción con id === :id                                                               |

Les mensaje de respuesta deberá ser, en todos los casos, un string JSON con la siguiente estructura:

```json
// en caso de éxito:
{
  "ok": true,
  "data": // data solicitada, creada, editada o eliminada
}

// en caso de error:
{
  "error": true,
  "message": // mensaje de error
}
```

### Filtros opcionales

Opcionalmente, el equipo deberá implementar la capacidad de filtrar la lista de canciones usando "Query Params". Estos son uno o más pares "key=value" que se colocan al final de la URL antecedidos por el símbolo "?". Los filtros disponibles serán:

- GET api/songs?**title=shape**: Retorna la lista de canciones cuyo título incluye el string "shape" (sin importar mayúsculas o minúsculas).
- GET api/songs?**artist=drake**: Retorna la lista de canciones cuyo artista incluye el string "drake" (sin importar mayúsculas o minúsculas).
- GET api/songs?**album=vida**: Retorna la lista de canciones cuyo álbum incluye el string "vida" (sin importar mayúsculas o minúsculas).
- GET api/songs?**year=2002**: Retorna la lista de canciones del año 2002
- GET api/songs?**genre=pop**: Retorna la lista de canciones cuyo género incluye el string "pop" (sin importar mayúsculas o minúsculas).

Es posible combinar cualquiera de los filtros, por ejemplo:

- GET api/songs?**genre=pop&&year=2002**: Retorna la lista de canciones cuyo genero incluya el string "pop" y cuyo año sea 2002.

Les recomendamos averiguar sobre las clases <a href="https://nodejs.org/api/url.html#class-url" target="_blank">URL</a> y <a href="https://nodejs.org/api/url.html#class-urlsearchparams" target="_blank">URLSearchParams</a> de Node.js que implementan la misma API que los navegadores.
