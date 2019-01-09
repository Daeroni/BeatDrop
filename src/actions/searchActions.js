import { SET_SEARCH_SOURCES, SUBMIT_SEARCH, SET_LOADING } from './types'
import { store } from '../store'

const { remote } = window.require('electron')
const Walker = remote.require('walker')
const fs = remote.require('fs')
const path = remote.require('path')

export const setSearchSources = sources => dispatch => {
  dispatch({
    type: SET_SEARCH_SOURCES,
    payload: sources
  })
}

export const submitSearch = keywords => dispatch => {
  let state = store.getState()

  dispatch({
    type: SET_LOADING,
    payload: true
  })

  let beatSaverResultsReady = false
  let beatSaverIdResultsReady = false
  let localResultsReady = false

  //Library Search
  let localSongs = []
  let localSongCount = 0
  let walkerEnded = false
  let decrementCounter = () => {
    localSongCount--
    if (walkerEnded && localSongCount === 0) {
      localSongs = localSongs.filter((song, i) => {
        for (let k=0; k<keywords.split(' ').length; k++) {
          if(song.songName.toLowerCase().includes(keywords.split(' ')[k].toLowerCase()) || song.songSubName.toLowerCase().includes(keywords.split(' ')[k].toLowerCase()) || song.authorName.toLowerCase().includes(keywords.split(' ')[k].toLowerCase())) return true
        }
        return false
      })
      if(beatSaverResultsReady && beatSaverIdResultsReady) {
        dispatch({
          type: SUBMIT_SEARCH,
          payload: {keywords, library: localSongs, beatSaver: beatSaverSongs, beatSaverId: idSong}
        })
        dispatch({
          type: SET_LOADING,
          payload: false
        })
        return
      }
      localResultsReady = true
    }
  }
  fs.access(path.join(state.settings.installationDirectory, 'CustomSongs'), err => {
    if (err) alert('Could not find CustomSongs directory. Please make sure you have your installation directory set correctly and have the proper plugins installed.')
    Walker(path.join(store.getState().settings.installationDirectory, 'CustomSongs'))
      .on('file', file => {
        let dirs = file.split('\\')
        dirs.pop()
        let dir = dirs.join('\\')
        if (file.substr(file.length - 9) === 'info.json') {
          localSongCount++
          fs.readFile(file, 'UTF-8', (err, data) => {
            if(err) { decrementCounter(); return }
            let song = JSON.parse(data)
            song.coverUrl = path.join(dir, song.coverImagePath)
            song.file = file
            localSongs.push(song)
            decrementCounter()
          })
        }
      })
      .on('end', () => {
        if (localSongCount === 0) {
          localSongs = localSongs.filter((song, i) => {
            for (let k=0; k<keywords.split(' ').length; k++) {
              if(song.songName.toLowerCase().includes(keywords.split(' ')[k].toLowerCase()) || song.songSubName.toLowerCase().includes(keywords.split(' ')[k].toLowerCase()) || song.authorName.toLowerCase().includes(keywords.split(' ')[k].toLowerCase())) return true
            }
            return false
          })
          if(beatSaverResultsReady) {
            dispatch({
              type: SUBMIT_SEARCH,
              payload: {keywords, library: localSongs, beatSaver: beatSaverSongs, beatSaverId: idSong}
            })
            dispatch({
              type: SET_LOADING,
              payload: false
            })
            return
          }
          localResultsReady = true
        }
        walkerEnded = true
      })
  })

  //BeatSaver Search
  let beatSaverSongs = []
  fetch('https://beatsaver.com/api/songs/search/all/' + keywords)
    .then(res => res.json())
    .then(data => {
      beatSaverSongs = data
      if(localResultsReady&beatSaverIdResultsReady) {
        dispatch({
          type: SUBMIT_SEARCH,
          payload: {keywords, library: localSongs, beatSaver: beatSaverSongs, beatSaverId: idSong}
        })
        dispatch({
          type: SET_LOADING,
          payload: false
        })
        return
      }
      beatSaverResultsReady = true
    })
  
  //BeatSaver ID Search
  let idSong = {}
  if(parseInt(keywords.replace('-', ''), 10)) {
    fetch('https://beatsaver.com/api/songs/detail/' + keywords)
    .then(res => res.json())
    .then(data => {
      idSong = data
      console.log(data)
      if(localResultsReady & beatSaverResultsReady) {
        dispatch({
          type: SUBMIT_SEARCH,
          payload: {keywords, library: localSongs, beatSaver: beatSaverSongs, beatSaverId: idSong}
        })
        dispatch({
          type: SET_LOADING,
          payload: false
        })
        return
      }
      beatSaverIdResultsReady = true
    })
  } else {
    beatSaverIdResultsReady = true
  }
}