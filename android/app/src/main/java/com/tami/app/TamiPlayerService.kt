package com.tami.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.session.MediaSession
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import org.json.JSONObject

class TamiPlayerService : Service() {

    companion object {
        const val ACTION_ADVERTISE = "com.tami.app.ADVERTISE"
        const val ACTION_HANDOFF = "com.tami.app.HANDOFF"
        const val ACTION_CODEC = "com.tami.app.CODEC"
        const val ACTION_STOP = "com.tami.app.STOP"
        const val ACTION_DISMISS = "com.tami.app.DISMISS"
        const val ACTION_CTRL = "com.tami.app.CTRL"
        const val EXTRA_CMD = "cmd"
        const val EXTRA_ARG = "arg"
        const val EXTRA_URL = "url"
        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
        const val EXTRA_POS = "pos"

        const val CHANNEL_ID = "tami_player"
        const val NOTIF_ID = 203

        const val MODE_NONE = 0
        const val MODE_ADVERTISE = 1
        const val MODE_HANDOFF = 2
        const val MODE_CODEC = 3

        @Volatile var mode = MODE_NONE
        @Volatile var handoffPayload: String? = null

        @Volatile
        private var liveService: TamiPlayerService? = null

        fun dismissNow(ctx: android.content.Context) {
            try {
                val i = Intent(ctx, TamiPlayerService::class.java).setAction(ACTION_DISMISS)
                ctx.startService(i)
            } catch (e: Exception) {}
        }

        fun refreshNotif() {
            try { liveService?.updateNotification() } catch (e: Exception) {}
        }

        fun codecInfo(): String {
            try {
                val svc = liveService ?: return "{}"
                if (mode != MODE_CODEC) return "{}"
                val mp = svc.mediaPlayer ?: return "{}"
                return try {
                    "{\"pos\":${mp.currentPosition},\"dur\":${mp.duration},\"playing\":${mp.isPlaying}}"
                } catch (e: Exception) { "{}" }
            } catch (e: Exception) { return "{}" }
        }

        fun finishBackground(): String {
            var payload = handoffPayload
            try {
                val svc = liveService
                if (svc != null) {
                    val pos = svc.currentPlayerPosMs()
                    if (pos >= 0) {
                        payload = JSONObject(payload ?: "{}").put("pos", pos).toString()
                        handoffPayload = payload
                    }
                    svc.stopAll()
                }
            } catch (e: Exception) {}
            handoffPayload = null
            mode = MODE_NONE
            return payload ?: ""
        }

        fun syncSessionPos(playing: Boolean, posMs: Long) {
            val s = liveSession ?: return
            try {
                val state = android.media.session.PlaybackState.Builder()
                    .setActions(
                        android.media.session.PlaybackState.ACTION_PLAY
                                or android.media.session.PlaybackState.ACTION_PAUSE
                                or android.media.session.PlaybackState.ACTION_PLAY_PAUSE
                                or android.media.session.PlaybackState.ACTION_SKIP_TO_NEXT
                                or android.media.session.PlaybackState.ACTION_SKIP_TO_PREVIOUS
                    )
                    .setState(
                        if (playing) android.media.session.PlaybackState.STATE_PLAYING
                        else android.media.session.PlaybackState.STATE_PAUSED,
                        posMs, 1f
                    )
                    .build()
                s.setPlaybackState(state)
            } catch (e: Exception) {}
        }

        @Volatile private var liveSession: MediaSession? = null
    }

    private var mediaPlayer: MediaPlayer? = null
    private var session: MediaSession? = null
    private var trackUrl: String? = null
    private var trackTitle = "TAMI"
    private var trackArtist = ""

    private val mediaCallback = object : MediaSession.Callback() {
        override fun onPlay() = doToggle()
        override fun onPause() = doToggle()
        override fun onStop() = stopAll()
        override fun onSkipToNext() = relayOrNothing("next")
        override fun onSkipToPrevious() = relayOrNothing("prev")
        override fun onSeekTo(pos: Long) {
            if (mode == MODE_HANDOFF || mode == MODE_CODEC) {
                try { mediaPlayer?.seekTo(pos.toInt()) } catch (e: Exception) {}
                liveSession?.let { s ->
                    MainActivity.nowPlayingPlaying?.let { playing ->
                        val mp = mediaPlayer
                        if (mp != null) syncSessionPos(playing, mp.currentPosition.toLong())
                    }
                }
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        try {
            session = MediaSession(this, "TamiPlayer").apply {
                setCallback(mediaCallback)
                setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS or MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS)
                liveSession = this
            }
            liveService = this
        } catch (e: Exception) {}
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_ADVERTISE -> {
                mode = MODE_ADVERTISE
                readAdvertiseMetadata()
                goForeground()
            }
            ACTION_HANDOFF -> {
                trackUrl = intent.getStringExtra(EXTRA_URL)
                trackTitle = intent.getStringExtra(EXTRA_TITLE) ?: "TAMI"
                trackArtist = intent.getStringExtra(EXTRA_ARTIST) ?: ""
                val pos = intent.getLongExtra(EXTRA_POS, 0L)
                if (trackUrl.isNullOrEmpty()) {
                    stopAll()
                    return START_NOT_STICKY
                }
                mode = MODE_HANDOFF
                goForeground()
                startHandoff(trackUrl!!, pos)
            }
            ACTION_CODEC -> {
                stopPlayback()
                trackUrl = intent.getStringExtra(EXTRA_URL)
                trackTitle = intent.getStringExtra(EXTRA_TITLE) ?: "TAMI"
                trackArtist = intent.getStringExtra(EXTRA_ARTIST) ?: ""
                val pos = intent.getLongExtra(EXTRA_POS, 0L)
                if (trackUrl.isNullOrEmpty()) {
                    stopAll()
                    return START_NOT_STICKY
                }
                mode = MODE_CODEC
                goForeground()
                startHandoff(trackUrl!!, pos)
            }
            ACTION_CTRL -> when (intent.getStringExtra(EXTRA_CMD)) {
                "playpause" -> doToggle()
                "next" -> relayOrNothing("next")
                "prev" -> relayOrNothing("prev")
                "play" -> if (mode == MODE_HANDOFF || mode == MODE_CODEC) {
                    try { mediaPlayer?.start() } catch (e: Exception) {}
                    updateNotification()
                }
                "pause" -> if (mode == MODE_HANDOFF || mode == MODE_CODEC) {
                    try { mediaPlayer?.pause() } catch (e: Exception) {}
                    updateNotification()
                }
                "seek" -> if (mode == MODE_HANDOFF || mode == MODE_CODEC) {
                    try { mediaPlayer?.seekTo(intent.getIntExtra(EXTRA_ARG, 0)) } catch (e: Exception) {}
                }
            }
            ACTION_STOP -> {
                if (mode == MODE_HANDOFF && !handoffPayload.isNullOrEmpty()) {
                    try {
                        val mp = mediaPlayer
                        if (mp != null) {
                            val o = JSONObject(handoffPayload!!).put("pos", mp.currentPosition.toLong())
                            handoffPayload = o.toString()
                        }
                    } catch (e: Exception) {}
                } else if (mode == MODE_ADVERTISE) {
                    MainActivity.relayControl("pause")
                }
                stopAll()
            }
            ACTION_DISMISS -> stopAll()
        }
        return START_NOT_STICKY
    }

    private fun readAdvertiseMetadata() {
        try {
            val j = MainActivity.nowPlayingJson ?: return
            val o = JSONObject(j)
            trackTitle = o.optString("title").ifEmpty { "TAMI" }
            trackArtist = o.optString("artist")
        } catch (e: Exception) {}
    }

    private fun goForeground() {
        try {
            val notif = buildNotification()
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(NOTIF_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
            } else {
                startForeground(NOTIF_ID, notif)
            }
        } catch (e: Exception) {
            try { startForeground(NOTIF_ID, buildNotification()) } catch (e2: Exception) {}
        }
    }

    private fun buildNotification(): Notification {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Reprodução TAMI", NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Controla a música que toca em segundo plano"
                    setShowBadge(false)
                }
            )
        }
        val playing = (mode == MODE_HANDOFF || mode == MODE_CODEC) && (mediaPlayer?.isPlaying ?: false)
        val openPi = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        fun pi(cmd: String, req: Int) = PendingIntent.getService(
            this, req,
            Intent(this, TamiPlayerService::class.java).setAction(ACTION_CTRL).putExtra(EXTRA_CMD, cmd),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val stopPi = PendingIntent.getService(
            this, 20,
            Intent(this, TamiPlayerService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        builder.setSmallIcon(android.R.drawable.sym_def_app_icon)
            .setContentTitle(if (trackTitle.isBlank()) "TAMI" else trackTitle)
            .setContentText(if (trackArtist.isBlank()) "Tocando…" else trackArtist)
            .setOngoing(true)
            .setShowWhen(false)
            .setContentIntent(openPi)
            .addAction(android.R.drawable.ic_media_previous, "Anterior", pi("prev", 11))
            .addAction(if (playing) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play, if (playing) "Pausar" else "Tocar", pi("playpause", 12))
            .addAction(android.R.drawable.ic_media_next, "Próxima", pi("next", 13))
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Fechar", stopPi)
        try {
            @Suppress("DEPRECATION")
            builder.setStyle(Notification.MediaStyle().setMediaSession(session?.sessionToken).setShowActionsInCompactView(0, 1, 2))
        } catch (e: Exception) {}
        return builder.build()
    }

    fun currentPlayerPosMs(): Long = runCatching { if (mediaPlayer?.isPlaying == true) mediaPlayer!!.currentPosition.toLong() else -1L }.getOrDefault(-1L)

    private fun startHandoff(url: String, pos: Long) {
        try {
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            mp.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK)
            mp.setDataSource(this, Uri.parse(url))
            mp.setOnPreparedListener { m ->
                try {
                    if (pos > 0) m.seekTo(pos.toInt())
                    m.start()
                    if (mode == MODE_HANDOFF) {
                        val payload = handoffPayload
                        if (!payload.isNullOrEmpty()) {
                            val o = JSONObject(payload).put("pos", m.currentPosition.toLong())
                            handoffPayload = o.toString()
                        }
                    }
                    updateNotification()
                    liveSession?.let { s -> syncSessionPos(true, m.currentPosition.toLong()) }
                } catch (e: Exception) {}
            }
            mp.setOnErrorListener { _, _, _ -> stopAll(); true }
            mp.setOnCompletionListener {
                if (mode == MODE_HANDOFF) stopAll()
                else if (mode == MODE_CODEC) {
                    MainActivity.relayControl("codecEnd")
                    stopAll()
                }
            }
            mp.prepareAsync()
            mediaPlayer = mp
        } catch (e: Exception) {
            stopAll()
        }
    }

    private fun doToggle() {
        if (mode == MODE_HANDOFF || mode == MODE_CODEC) {
            val mp = mediaPlayer
            if (mp == null) return
            try {
                if (mp.isPlaying) mp.pause() else mp.start()
                liveSession?.let { s -> syncSessionPos(mp.isPlaying, mp.currentPosition.toLong()) }
            } catch (e: Exception) {}
            updateNotification()
        } else {
            MainActivity.relayControl(
                if (MainActivity.nowPlayingPlaying == true) "pause" else "play"
            )
        }
    }

    private fun relayOrNothing(cmd: String) {
        if (mode == MODE_HANDOFF) return
        MainActivity.relayControl(cmd)
    }

    private fun stopPlayback() {
        try {
            mediaPlayer?.let { m ->
                try { if (m.isPlaying) m.stop() } catch (e: Exception) {}
                try { m.release() } catch (e: Exception) {}
            }
        } catch (e: Exception) {}
        mediaPlayer = null
    }

    private fun updateNotification() {
        try {
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(NOTIF_ID, buildNotification())
        } catch (e: Exception) {}
    }

    private fun stopAll() {
        stopPlayback()
        try { session?.release() } catch (e: Exception) {}
        session = null
        liveSession = null
        liveService = null
        mode = MODE_NONE
        try { stopForeground(true) } catch (e: Exception) {}
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopAll()
    }
}