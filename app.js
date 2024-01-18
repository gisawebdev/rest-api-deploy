const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')

const moviesJSON = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:1234',
      'http://localhost:8080',
      'https://movies.com'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Origin not allowed'), false)
  }
}))

app.disable('x-powered-by')

// metodos normales: GET/HEAD/POST
// metodos complejos: PUT/PATCH/DELETE

// CORS PRE-FLIGHT
// OPTIONS

// * GETs

app.get('/movies', (req, res) => {
  const { genre } = req.query

  if (genre) {
    const filteredMovies = moviesJSON.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLocaleLowerCase()))

    return res.json(filteredMovies)
  }
  res.json(moviesJSON)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = moviesJSON.find(movie => movie.id === id)

  if (movie) return res.json(movie)

  res.status(404).json({ error: 'Movie not found' })
})

// * POSTs

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // esto no es REST, porque estamos guardando
  // el estado de la app en memoria

  moviesJSON.push(newMovie)
  res.status(201).json(newMovie)
})

// * PATCHs

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ error: 'Movie not found' })

  const updatedMovie = {
    ...moviesJSON[movieIndex],
    ...result.data
  }

  moviesJSON[movieIndex] = updatedMovie

  return res.json(updatedMovie)
})

// * DELETEs

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ error: 'Movie not found' })

  moviesJSON.splice(movieIndex, 1)

  return res.status(204).send()
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`)
})
