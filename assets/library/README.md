# ThreadViral Resource Mirror

Crawled on 04/11/2026 from the media catalogue observed in the logged-in UI.

Open index.html for an offline searchable library with audio/video playback.

Verified files: 1112/1112. Total size: 154.08 MiB.

Kinds: {"background_music": 39, "sound_effect": 134, "background_image": 356, "sticker": 453, "background_video": 32, "poster": 10, "font": 53, "voice_preview": 35}

Audio/video are the preview variants that the UI actually serves; they are NOT represented as original/master files. Original URLs that returned 404 are recorded separately in crawl-manifest.json. Original copyright metadata is preserved in resources-manifest.json; downloaded availability does not change that metadata. Procedural backgrounds/subtitle styles are code-generated; their observed labels are in ui-presets.json, not falsely represented as downloaded videos.

No account details, cookies, tokens or copied application JavaScript are included.

Repo integration: 32 reference video backgrounds available under backgrounds/; 39 background tracks under bgm/; 453 sticker images under memes/ via hard links. SFX, fonts and the canonical catalogue live under assets/library/. Existing server on port 8000 was not stopped or duplicated.

Run .venv/Scripts/python.exe tools/sync_resources.py --verify to check the hashes, or --download to restore missing public files.

Voice update 05/11/2026: 35 Vietnamese preview MP3 files under voices/, with searchable offline browser and source metadata. These are fixed audio samples, not synthesis models.
