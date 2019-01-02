import React, { Component } from 'react'
import PropTypes from 'prop-types'
import '../css/SongList.css'

import { connect } from 'react-redux'
import { refresh, loadMore } from '../actions/songListActions'

import SongListItem from './SongListItem'
import LoadMore from './LoadMore';

function MapsSongs(props) {
  if(props.loading) {
    return (
      <SongListItem loading />
    )
  } else {
    return (
      props.songs.map((song, i) => {
        return <SongListItem key={i} title={song.songName} artist={song.authorName} uploader={song.uploader} difficulties={song.difficulties} imageSource={song.coverUrl} songKey={song.key} file={song.file} downloads={song.downloadCount} upvotes={song.upVotes} downvotes={song.downVotes} plays={song.playedCount} />
      })
    )
  }
}

class SongList extends Component {

  componentWillMount() {
    this.props.refresh()
  }

  componentDidMount() {
    document.getElementById('song-list').addEventListener('scroll', this.onScroll.bind(this))
  }
  
  componentWillUnmount() {
    document.getElementById('song-list').removeEventListener('scroll', this.onScroll)
  }

  onScroll() {
    let songList = document.getElementById('song-list')
    if(((songList.scrollHeight - songList.scrollTop) - songList.clientHeight) <= 1) {
      if(!this.props.loadingMore && !this.props.loading && this.props.autoLoadMore) {
        this.props.loadMore()
      }
    }
  }

  render() {
    return (
      <ul id='song-list'>
        <MapsSongs loading={this.props.loading} songs={this.props.songs} source={this.props.source} />
        <LoadMore songs={this.props.songs} />
      </ul>
    )
  }
}

SongList.propTypes = {
  loading: PropTypes.bool.isRequired,
  loadingMore: PropTypes.bool.isRequired,
  songs: PropTypes.array.isRequired,
  refresh: PropTypes.func.isRequired,
  loadMore: PropTypes.func.isRequired,
  autoLoadMore: PropTypes.bool.isRequired,
  source: PropTypes.string.isRequired
}

const mapStateToProps = state => ({
  songs: state.songs.songs,
  loading: state.loading,
  loadingMore: state.loadingMore,
  autoLoadMore: state.settings.autoLoadMore,
  source: state.source.source
})

export default connect(mapStateToProps, { refresh, loadMore })(SongList)