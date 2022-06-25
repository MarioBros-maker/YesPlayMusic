import TrackListHeader from '@/web/components/New/TrackListHeader'
import useAlbum from '@/web/api/hooks/useAlbum'
import useTracks from '@/web/api/hooks/useTracks'
import { NavLink, useParams } from 'react-router-dom'
import PageTransition from '@/web/components/New/PageTransition'
import TrackList from '@/web/components/New/TrackList'
import { player } from '@/web/store'
import toast from 'react-hot-toast'
import { useSnapshot } from 'valtio'
import useArtistAlbums from '@/web/api/hooks/useArtistAlbums'
import { css, cx } from '@emotion/css'
import CoverRow from '@/web/components/New/CoverRow'
import { useMemo } from 'react'
import 'plyr-react/plyr.css'

const MoreByArtist = ({ album }: { album?: Album }) => {
  const { data: albums } = useArtistAlbums({
    id: album?.artist?.id || 0,
    limit: 1000,
  })

  const filteredAlbums = useMemo((): Album[] => {
    if (!albums) return []
    const allReleases = albums?.hotAlbums || []
    const filteredAlbums = allReleases.filter(
      album =>
        ['专辑', 'EP/Single', 'EP'].includes(album.type) && album.size > 1
    )
    const singles = allReleases.filter(
      album => album.type === 'Single' || album.size === 1
    )

    const qualifiedAlbums = [...filteredAlbums, ...singles]

    const formatName = (name: string) =>
      name.toLowerCase().replace(/(\s|deluxe|edition|\(|\))/g, '')

    const uniqueAlbums: Album[] = []
    qualifiedAlbums.forEach(a => {
      // 去除当前页面的专辑
      if (formatName(a.name) === formatName(album?.name ?? '')) return

      // 去除重复的专辑(包含 deluxe edition 的专辑会视为重复)
      if (
        uniqueAlbums.findIndex(aa => {
          return formatName(a.name) === formatName(aa.name)
        }) !== -1
      ) {
        return
      }

      // 去除 remix 专辑
      if (
        a.name.toLowerCase().includes('remix)') ||
        a.name.toLowerCase().includes('remixes)')
      ) {
        return
      }

      uniqueAlbums.push(a)
    })

    return uniqueAlbums.slice(0, 4)
  }, [album?.name, albums])

  return (
    <div>
      {/* Dividing line */}
      <div className={cx('mx-2.5 my-7.5 h-px bg-white/10 lg:mx-0')}></div>

      {/* Title */}
      <div className='mx-2.5 mb-5 text-14 font-bold text-neutral-300 lg:mx-0'>
        MORE BY{' '}
        <NavLink
          to={`/artist/${album?.artist.id}`}
          className='transition duration-300 ease-in-out hover:text-neutral-100'
        >
          {album?.artist.name}
        </NavLink>
      </div>

      <CoverRow albums={filteredAlbums} className='mx-2.5 lg:mx-0' />
    </div>
  )
}

const Album = () => {
  const params = useParams()
  const { data: album } = useAlbum({
    id: Number(params.id),
  })

  const { data: tracks } = useTracks({
    ids: album?.songs?.map(track => track.id) ?? [],
  })

  const playerSnapshot = useSnapshot(player)

  const onPlay = async (trackID: number | null = null) => {
    if (!album?.album.id) {
      toast('无法播放专辑，该专辑不存在')
      return
    }
    if (
      playerSnapshot.trackListSource?.type === 'album' &&
      playerSnapshot.trackListSource?.id === album.album.id
    ) {
      await player.playTrack(trackID ?? album.songs[0].id)
      return
    }
    await player.playAlbum(album.album.id, trackID)
  }

  return (
    <PageTransition>
      <TrackListHeader album={album?.album} onPlay={onPlay} />
      <TrackList
        tracks={tracks?.songs || album?.songs || album?.album.songs}
        className='z-10 mx-2.5 mt-3 lg:mx-0 lg:mt-10'
        onPlay={onPlay}
      />
      <MoreByArtist album={album?.album} />
    </PageTransition>
  )
}

export default Album