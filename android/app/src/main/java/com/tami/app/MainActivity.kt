package com.tami.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.ContentUris
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.provider.MediaStore
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var tts: TextToSpeech
    private var pendingTtsLang: Locale? = null
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingApk: File? = null

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val callback = filePathCallback
        filePathCallback = null
        if (callback == null) return@registerForActivityResult
        val data = result.data
        val results = if (result.resultCode == RESULT_OK && data != null) {
            val clip = data.clipData
            when {
                clip != null -> (0 until clip.itemCount).map { i -> clip.getItemAt(i).uri }.toTypedArray()
                data.data != null -> arrayOf(data.data!!)
                else -> null
            }
        } else null
        callback.onReceiveValue(results)
    }

    inner class TamiBridge {
        @JavascriptInterface
        fun appVersion(): String = try {
            packageManager.getPackageInfo(packageName, 0).versionName ?: ""
        } catch (e: Exception) {
            ""
        }

        @JavascriptInterface
        fun speak(text: String) {
            runOnUiThread {
                try {
                    if (!::tts.isInitialized || tts.isSpeaking) tts.stop()
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tami")
                } catch (e: Exception) {}
            }
        }

        @JavascriptInterface
        fun stopSpeaking() {
            runOnUiThread { try { if (::tts.isInitialized) tts.stop() } catch (e: Exception) {} }
        }

        @JavascriptInterface
        fun setLang(lang: String) {
            val locale = when (lang) {
                "en" -> Locale("en", "US")
                "es" -> Locale("es", "ES")
                else -> Locale("pt", "BR")
            }
            runOnUiThread {
                try {
                    if (::tts.isInitialized) applyTtsLanguage(locale)
                    else pendingTtsLang = locale
                } catch (e: Exception) {}
            }
        }

        @JavascriptInterface
        fun songSize(url: String): Long {
            return try {
                val pfd = contentResolver.openFileDescriptor(Uri.parse(url), "r")
                if (pfd == null) 0L else pfd.statSize.also { pfd.close() }
            } catch (e: Exception) {
                0L
            }
        }

        @JavascriptInterface
        fun readSong(url: String, start: Long, len: Int): String {
            return try {
                val pfd = contentResolver.openFileDescriptor(Uri.parse(url), "r") ?: return ""
                val out = java.io.ByteArrayOutputStream()
                pfd.use { fd ->
                    val total = fd.statSize
                    if (start >= total) return ""
                    val n = minOf(len.toLong(), total - start).toInt()
                    val ins = ParcelFileDescriptor.AutoCloseInputStream(fd)
                    if (!skipFully(ins, start)) return ""
                    val buf = ByteArray(8192)
                    var remaining = n
                    while (remaining > 0) {
                        val r = ins.read(buf, 0, minOf(buf.size, remaining))
                        if (r < 0) break
                        out.write(buf, 0, r)
                        remaining -= r
                    }
                }
                android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
            } catch (e: Exception) {
                ""
            }
        }

        @JavascriptInterface
        fun mediaInfo(url: String): String {
            return try {
                val uri = Uri.parse(url)
                val pfd = contentResolver.openFileDescriptor(uri, "r") ?: return "{}"
                val mime = resolveMime(uri, pfd)
                pfd.use { fd ->
                    val size = fd.statSize
                    val name = contentResolver.query(uri, arrayOf(MediaStore.Audio.Media.DISPLAY_NAME), null, null, null)
                        ?.use { if (it.moveToFirst()) it.getString(0) else null } ?: ""
                    val dur = contentResolver.query(uri, arrayOf(MediaStore.Audio.Media.DURATION), null, null, null)
                        ?.use { if (it.moveToFirst()) it.getLong(0) else 0L } ?: 0L
                    val codec = codecLabel(fd, mime)
                    "{\"n\":${jsEsc(name)},\"s\":$size,\"m\":${jsEsc(mime)},\"c\":${jsEsc(codec)},\"d\":$dur}"
                }
            } catch (e: Exception) {
                "{}"
            }
        }

        @JavascriptInterface
        fun scanMusic(): String {
            if (!hasReadPermission()) {
                runOnUiThread { requestReadPermission() }
                return "[]"
            }
            return try {
                val out = StringBuilder("[")
                var first = true
                val projection = arrayOf(
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.ALBUM,
                    MediaStore.Audio.Media.DURATION
                )
                val sort = MediaStore.Audio.Media.TITLE + " COLLATE NOCASE ASC"
                contentResolver.query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, projection, null, null, sort)
                    ?.use { cur ->
                        val idC = cur.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                        val tC = cur.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                        val aC = cur.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                        val bC = cur.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                        val dC = cur.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                        while (cur.moveToNext()) {
                            val id = cur.getLong(idC)
                            val uri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id).toString()
                            val n = jsEsc(cur.getString(tC) ?: "")
                            val a = jsEsc(cur.getString(aC) ?: "")
                            val b = jsEsc(cur.getString(bC) ?: "")
                            val d = cur.getLong(dC)
                            if (!first) out.append(",")
                            first = false
                            out.append("{\"n\":$n,\"a\":$a,\"b\":$b,\"d\":$d,\"u\":\"$uri\"}")
                        }
                    }
                out.append("]")
                out.toString()
            } catch (e: Exception) { "[]" }
        }

        private fun jsEsc(s: String): String {
            val sb = StringBuilder("\"")
            for (c in s) {
                when (c) {
                    '"' -> sb.append("\\\"")
                    '\\' -> sb.append("\\\\")
                    '\n' -> sb.append("\\n")
                    '\r' -> sb.append("\\r")
                    '\t' -> sb.append("\\t")
                    else -> if (c.code < 0x20) sb.append("\\u%04x".format(c.code)) else sb.append(c)
                }
            }
            return sb.append("\"").toString()
        }

        @JavascriptInterface
        fun installUpdate(url: String) {
            if (!url.startsWith("https://") && !url.startsWith("http://")) return
            runOnUiThread { Toast.makeText(this@MainActivity, "Baixando atualização…", Toast.LENGTH_SHORT).show() }
            Thread {
                try {
                    val dir = File(cacheDir, "updates").apply { mkdirs() }
                    val apk = File(dir, "tami-update.apk")
                    val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 15000
                        readTimeout = 60000
                        instanceFollowRedirects = true
                    }
                    conn.inputStream.use { input -> apk.outputStream().use { input.copyTo(it) } }
                    conn.disconnect()
                    runOnUiThread { installApk(apk) }
                } catch (e: Exception) {
                    runOnUiThread { Toast.makeText(this@MainActivity, "Falha ao baixar: ${e.message}", Toast.LENGTH_LONG).show() }
                }
            }.start()
        }

        @JavascriptInterface
        fun openExternal(url: String) {
            runOnUiThread {
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Não foi possível abrir o link.", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun installApk(apk: File) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !packageManager.canRequestPackageInstalls()) {
            pendingApk = apk
            Toast.makeText(this, "Permita instalar apps desconhecidos para atualizar a TAMI.", Toast.LENGTH_LONG).show()
            try {
                startActivity(
                    Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:$packageName"))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            } catch (e: Exception) {
                Toast.makeText(this, "Ative a permissão de instalar apps e toque em atualizar novamente.", Toast.LENGTH_LONG).show()
            }
            return
        }
        pendingApk = null
        try {
            val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", apk)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Não foi possível abrir o instalador.", Toast.LENGTH_LONG).show()
        }
    }

    private fun hasReadPermission(): Boolean = if (Build.VERSION.SDK_INT >= 33) {
        ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED
    } else {
        ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestReadPermission() {
        val perm = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_AUDIO else Manifest.permission.READ_EXTERNAL_STORAGE
        ActivityCompat.requestPermissions(this, arrayOf(perm), 2)
    }

    private fun serveContent(uri: Uri, rangeHeader: String?): WebResourceResponse? {
        return try {
            val pfd = contentResolver.openFileDescriptor(uri, "r") ?: return null
            val total = pfd.statSize
            val mime = resolveMime(uri, pfd)
            val stream = ParcelFileDescriptor.AutoCloseInputStream(pfd)
            if (rangeHeader != null && total > 0) {
                val m = Regex("bytes=(\\d+)-(\\d*)").find(rangeHeader)
                if (m != null) {
                    val start = m.groupValues[1].toLong()
                    var end = if (m.groupValues[2].isNotEmpty()) m.groupValues[2].toLong() else total - 1
                    if (end >= total) end = total - 1
                    if (start < total && start <= end && skipFully(stream, start)) {
                        val len = end - start + 1
                        val headers = mapOf(
                            "Accept-Ranges" to "bytes",
                            "Content-Range" to "bytes $start-$end/$total",
                            "Content-Length" to len.toString()
                        )
                        return WebResourceResponse(mime, null, 206, "Partial Content", headers, stream)
                    }
                }
            }
            val headers = mapOf("Accept-Ranges" to "bytes", "Content-Length" to total.toString())
            WebResourceResponse(mime, null, 200, "OK", headers, stream)
        } catch (e: Exception) {
            null
        }
    }

    private fun sniffMime(pfd: ParcelFileDescriptor): String? {
        return try {
            pfd.dup().use { dup ->
                ParcelFileDescriptor.AutoCloseInputStream(dup).use { ins ->
                    val buf = ByteArray(16)
                    val n = ins.read(buf, 0, buf.size)
                    if (n < 12) return null
                    fun b(i: Int): Int = buf[i].toInt() and 0xFF
                    fun s(off: Int, len: Int): String = String(buf, off, len, Charsets.ISO_8859_1)
                    when {
                        s(0, 3) == "ID3" -> "audio/mpeg"
                        s(4, 4) == "ftyp" -> "audio/mp4"
                        s(0, 4) == "OggS" -> "audio/ogg"
                        s(0, 4) == "fLaC" -> "audio/flac"
                        s(0, 4) == "RIFF" && s(8, 4) == "WAVE" -> "audio/wav"
                        s(0, 4) == "RIFF" && s(8, 4) == "WMA " -> "audio/x-ms-wma"
                        s(0, 4) == "#!AM" && b(4) == 'R'.code -> "audio/amr"
                        b(0) == 0xFF && b(1).and(0xE0) == 0xE0 -> "audio/mpeg"
                        b(0) == 0xFF && b(1).and(0xF6) == 0xF0 -> "audio/aac"
                        else -> null
                    }
                }
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun resolveMime(uri: Uri, pfd: ParcelFileDescriptor): String {
        val sniffed = sniffMime(pfd)
        if (sniffed != null) return sniffed
        return queryDisplayNameMime(uri).ifEmpty {
            when (val t = contentResolver.getType(uri) ?: "") {
                "", "application/octet-stream", "*/*" -> "audio/mpeg"
                else -> normalizeMime(t)
            }
        }
    }

    private fun codecLabel(pfd: ParcelFileDescriptor, mime: String?): String {
        return try {
            val head = pfd.dup().use { d ->
                ParcelFileDescriptor.AutoCloseInputStream(d).use { ins ->
                    val buf = ByteArray(1024 * 1024)
                    val n = ins.read(buf, 0, buf.size)
                    if (n <= 0) "" else String(buf, 0, n, Charsets.ISO_8859_1)
                }
            }
            when (mime) {
                "audio/mpeg" -> "MP3"
                "audio/aac" -> "AAC"
                "audio/flac" -> "FLAC"
                "audio/wav" -> "WAV / PCM"
                "audio/x-ms-wma" -> "WMA (sem suporte no WebView)"
                "audio/amr" -> "AMR (sem suporte no WebView)"
                "audio/ogg" -> if (head.contains("OpusHead")) "Opus (Ogg)" else "Vorbis (Ogg)"
                "audio/mp4" -> when {
                    head.contains("alac") -> "ALAC (MOV)"
                    head.contains("OpusHead") -> "Opus (MP4)"
                    head.contains(".mp3") -> "MP3 (em MP4)"
                    head.contains("ac-3") -> "AC-3"
                    head.contains("ec-3") -> "E-AC-3"
                    else -> "AAC (MP4)"
                }
                else -> "Container desconhecido"
            }
        } catch (e: Exception) {
            "Container desconhecido"
        }
    }

    private fun normalizeMime(t: String): String {
        return when (t.lowercase()) {
            "audio/x-m4a", "audio/x-m4b", "audio/x-m4p", "audio/mp4a-latm", "audio/x-mp4a" -> "audio/mp4"
            "audio/x-flac" -> "audio/flac"
            "audio/x-wav", "audio/wav" -> "audio/wav"
            "audio/x-ogg", "audio/vorbis", "audio/x-vorbis" -> "audio/ogg"
            "audio/x-ms-wma", "audio/x-ape", "audio/x-wavpack" -> t
            else -> t
        }
    }

    private fun skipFully(ins: InputStream, n: Long): Boolean {
        var remaining = n
        while (remaining > 0) {
            val skipped = ins.skip(remaining)
            if (skipped <= 0) {
                if (ins.read() == -1) return false
                remaining -= 1
            } else {
                remaining -= skipped
            }
        }
        return true
    }

    private fun queryDisplayNameMime(uri: Uri): String {
        return try {
            val name = contentResolver.query(uri, arrayOf(MediaStore.Audio.Media.DISPLAY_NAME), null, null, null)
                ?.use { if (it.moveToFirst()) it.getString(0) else null } ?: return ""
            when {
                name.endsWith(".mp3", true) -> "audio/mpeg"
                name.endsWith(".m4a", true) || name.endsWith(".m4b", true) || name.endsWith(".m4p", true) || name.endsWith(".mp4a", true) -> "audio/mp4"
                name.endsWith(".aac", true) -> "audio/aac"
                name.endsWith(".ogg", true) || name.endsWith(".opus", true) -> "audio/ogg"
                name.endsWith(".wav", true) -> "audio/x-wav"
                name.endsWith(".flac", true) -> "audio/flac"
                name.endsWith(".amr", true) -> "audio/amr"
                else -> ""
            }
        } catch (e: Exception) {
            ""
        }
    }

    private fun applyTtsLanguage(locale: Locale) {
        val res = tts.setLanguage(locale)
        if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
            tts.setLanguage(Locale.getDefault())
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val pending = pendingTtsLang
                applyTtsLanguage(pending ?: Locale("pt", "BR"))
                pendingTtsLang = null
            }
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 1)
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.addJavascriptInterface(TamiBridge(), "TamiNative")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val url = request.url
                if (url.scheme == "content") {
                    return serveContent(url, request.requestHeaders?.get("Range"))
                }
                return assetLoader.shouldInterceptRequest(url)
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                return if (url.host == "appassets.androidplatform.net") {
                    false
                } else {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    } catch (e: Exception) {
                    }
                    true
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                request.grant(request.resources)
            }

            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                return try {
                    fileChooserLauncher.launch(params.createIntent())
                    true
                } catch (e: Exception) {
                    filePathCallback = null
                    callback.onReceiveValue(null)
                    false
                }
            }
        }

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onResume() {
        super.onResume()
        val apk = pendingApk
        if (apk != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && packageManager.canRequestPackageInstalls()) {
            installApk(apk)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        super.onDestroy()
        try { if (::tts.isInitialized) tts.shutdown() } catch (e: Exception) {}
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    companion object {
        private const val START_URL = "https://appassets.androidplatform.net/assets/index.html"
    }
}
