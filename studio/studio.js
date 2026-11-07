
function updateRenderIndicator(count) {
  const pill = $('#render-status-indicator');
  const txt = $('#render-status-text');
  if (!pill) return;
  if (count && count > 0) {
    pill.style.display = 'inline-flex';
    txt.textContent = `⚡ ${count} video đang dựng`;
  } else {
    pill.style.display = 'none';
  }
}

import {voicePanel, voiceBrowser, playReferenceVoice} from '/studio-files/voices.js?v=20261105.voices1';
import {automation, automationPanel, planDialog, aiPlanDialog, autoMediaNodes} from '/studio-files/automation.js?v=20261105.voices1';
import {subtitlePanel, subtitleNode, presetSelection, subtitleSettings, subtitleLabel, updateSubtitlePreview} from '/studio-files/subtitles.js?v=20261105.voices1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svgs={
plus:'<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
minus:'<line x1="5" y1="12" x2="19" y2="12"></line>',
close:'<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
check:'<polyline points="20 6 9 17 4 12"></polyline>',
play:'<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>',
pause:'<rect x="6" y="4" width="4" height="16" fill="currentColor"></rect><rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>',
trash:'<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
copy:'<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
undo:'<path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>',
redo:'<path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>',
settings:'<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
video:'<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>',
music:'<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
sound:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>',
folder:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
text:'<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>',
image:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
shape:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>',
spark:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path>',
download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
down:'<polyline points="6 9 12 15 18 9"></polyline>',
up:'<polyline points="18 15 12 9 6 15"></polyline>',
chevron:'<polyline points="9 18 15 12 9 6"></polyline>',
arrow:'<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
back:'<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>',
lock:'<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
grip:'<circle cx="9" cy="5" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="9" cy="19" r="1.5"></circle><circle cx="15" cy="5" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="15" cy="19" r="1.5"></circle>',
expand:'<polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>',
grid:'<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
search:'<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
menu:'<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>',
home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgs[n]||svgs.spark}</svg>`;
const modes={water:'Lưới sóng nước',waves:'Sóng S uốn lượn',grid:'Lưới kẻ ô (chạy)',tunnel:'Đường hầm 2 khung',wave3d:'Lưới 3D gợn sóng',particles:'Hạt sáng bay',lightspeed:'Tốc độ ánh sáng',contours:'Đường đồng mức',network:'Mạng lưới trôi',rain:'Mưa vạch dọc',dust:'Bụi sáng xoay'};
const defaultStyle={enabled:true,theme:'light',card_width:80,card_y:20,hide_date:true,hide_avatar:false,blur_identity:false,blur_avatar:false,redact_words:'',background_mode:'grid',background_image:'',grid_color:'#5740b2',subtitle:true,subtitle_y:84,subtitle_size:44,subtitle_color:'#ffffff',section:'body',subtitle_preset:'bold-gold',subtitle_motion:'bounce',film_effect:'none',cover_enabled:false,cover_title:'',cover_seconds:2,hook_text:'',outro_text:'',transition:'cut',sfx_source:'',sfx_volume:.12,layers:[]};
const sample={author:'ngocanh.daily',time_ago:'2 giờ',display_text:'Có những buổi chiều chỉ muốn tắt hết thông báo, pha một ly cà phê và ngồi nhìn thành phố lên đèn. Bình yên đôi khi đơn giản vậy thôi 🌇',tts_text:'Có những buổi chiều chỉ muốn tắt hết thông báo, pha một ly cà phê và ngồi nhìn thành phố lên đèn.',likes:'12K',comments:'318',reposts:'96',shares:'54',author_liked:true};
let stored={};try{stored=JSON.parse(localStorage.getItem('tv-local-studio')||'{}');}catch{}
let S={style:{...defaultStyle,...stored.style},scenes:stored.scenes||[],voice:stored.voice||'vi-VN-HoaiMyNeural',speed:stored.speed||'+0%',bg:stored.bg||'random',bgm:stored.bgm||null,volume:stored.volume??.12,watermark:stored.watermark||'',resolution:stored.resolution||'1080x1920',silent:stored.silent??false};
const presetAliases={karaoke:'bold-gold',comic:'rounded-comic',bold:'short-bold',soft:'rounded-white',neon:'rounded-neon'};if(presetAliases[S.style.subtitle_preset])S.style.subtitle_preset=presetAliases[S.style.subtitle_preset];
let previewSceneIndex=0,previewCursor=0,previewStarted=0,submitting=false;
let resourceTab='all',resourceSearch='',resourcePageNum=0;
const RESOURCE_PAGE_SIZE=40;
let resources=[],route='setup',panel=null,selected='card',section='body',playing=false,zoom=1,undo=[],redo=[],frameId,cardVersion=0,jobId=localStorage.getItem('tv-studio-job')||null,resourceKind='background_image',assetQuery='',assetPage=0,insertContext='background';
function persist(){localStorage.setItem('tv-local-studio',JSON.stringify(S));$('.status')&&( $('.status').innerHTML=icon('check')+'Đã lưu local');}
function snapshot(){undo.push(JSON.stringify(S));if(undo.length>35)undo.shift();redo=[];}
function toast(s, type='success'){
  if($('#dialog')?.open){
    let msg=$('#dialog .dialog-error');
    if(!msg){
      msg=document.createElement('p');
      msg.className='note dialog-error';
      $('#dialog').append(msg);
    }
    msg.textContent=s;
  }
  const t=$('#toast');
  if(!t)return;
  const isErr = type === 'error' || /lỗi|thất bại|không thể|error/i.test(s);
  const iconSvg = isErr
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" style="width:18px;height:18px;flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" style="width:18px;height:18px;flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 11 15 16 9"></polyline></svg>`;
  t.innerHTML = `${iconSvg}<span style="line-height:1.4;">${esc(s)}</span>`;
  t.style.borderColor = isErr ? '#ef4444' : '#10b981';
  t.style.boxShadow = isErr
    ? '0 12px 30px -4px rgba(0,0,0,0.8), 0 0 24px rgba(239,68,68,0.35)'
    : '0 12px 30px -4px rgba(0,0,0,0.8), 0 0 24px rgba(16,185,129,0.35)';
  t.className='show';
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>t.className='',4500);
}
async function api(path,body,opts={}){
  const method=opts.method||(body?'POST':'GET');
  const r=await fetch(path,{
    method,
    headers:body&&typeof body==='object'?{'Content-Type':'application/json'}:{},
    body:body&&typeof body==='object'?JSON.stringify(body):undefined
  });
  let j;
  try {
    j=await r.json();
  } catch(_) {
    const text=await r.text().catch(()=>'');
    if(!r.ok)throw new Error(`Lỗi (${r.status}): ${text||r.statusText}`);
    return text;
  }
  if(!r.ok){
    throw new Error(typeof j?.detail==='string'?j.detail:JSON.stringify(j?.detail||j||'Lỗi yêu cầu'));
  }
  return j;
}
function accessibleFields(root=document){root.querySelectorAll('label').forEach(label=>{const next=label.nextElementSibling;const field=label.querySelector('input,textarea,select')||(next?.matches('input,textarea,select')?next:null);if(field&&!field.hasAttribute('aria-label'))field.setAttribute('aria-label',label.textContent.trim());});}
function dialog(title,body){const d=$('#dialog');if(d.open)d.close();d.innerHTML=`<div class="dialog-head"><h2>${esc(title)}</h2><button data-action="close-dialog" aria-label="Đóng">${icon('close')}</button></div>${body}`;accessibleFields(d);d.showModal();}
const activeScene=()=>S.scenes[previewSceneIndex]&&S.scenes[previewSceneIndex].selected!==false?S.scenes[previewSceneIndex]:S.scenes.find(s=>s.selected!==false)||sample;
const previewDuration=()=>section==='cover'?S.style.cover_seconds||2:Math.max(3,((section==='hook'?S.style.hook_text:activeScene().tts_text||activeScene().display_text)||'').split(/\s+/).length/2.7);
const names={automation:'Tự động',brand:'Thương hiệu',content:'Nội dung',frame:'Khung hình',background:'Nền video',voice:'Giọng đọc',music:'Nhạc nền',card:'Ảnh chụp bài viết',subtitle:'Phụ đề',sticker:'Nhãn dán',signature:'Chữ ký kênh'};
const dockDescriptions={automation:'Gợi ý B-roll, sticker, SFX',brand:'Hồ sơ, logo, hashtag',content:'Cách kể, bình luận, độ dài',frame:'Bố cục, cảnh kết, tiêu đề',background:'Nền video và nền bìa',voice:'Ngôn ngữ, giọng và nhịp đọc',music:'Nhạc và âm lượng',card:'Giao diện thẻ bài viết',subtitle:'Chữ chạy theo lời đọc',sticker:'Nhân vật dán lên video',signature:'Chữ ký và watermark'};
function dockValue(k){return ({automation:S.scenes.filter(s=>s.studio_media).length+' cảnh có minh họa',brand:S.watermark||'Bộ nhận diện local',content:`Tiếng Việt · ${S.scenes.length} cảnh`,frame:'Mỗi bình luận một cảnh',background:modes[S.style.background_mode]||S.style.background_mode,voice:S.voice.includes('HoaiMy')?'Hoài My · Tiếng Việt':'Nam Minh · Tiếng Việt',music:S.bgm||'Không nhạc nền',card:`Card ${S.style.theme==='light'?'sáng':'tối'} · ${S.style.card_width}%`,subtitle:subtitleLabel(S.style),sticker:S.style.layers.filter(l=>l.kind==='image').length+' lớp ảnh',signature:S.watermark||'Tắt'})[k];}

const MediaPreview = {
  audio: null,
  videoEl: null,
  activeBtn: null,
  activeSrc: null,
  activeKind: null,

  stop() {
    if (this.audio) {
      try { this.audio.pause(); this.audio.src = ''; } catch {}
      this.audio = null;
    }
    if (this.videoEl) {
      try { this.videoEl.pause(); } catch {}
      this.videoEl = null;
    }
    if (this.activeBtn) {
      this.setBtnState(this.activeBtn, 'idle');
      this.activeBtn = null;
    }
    this.activeSrc = null;
    this.activeKind = null;
    document.querySelectorAll('.btn-preview-state.is-playing, .btn-preview-state.is-loading').forEach(b => {
      this.setBtnState(b, 'idle');
    });
  },

  setBtnState(btn, state) {
    if (!btn) return;
    const kind = btn.dataset.previewKind || 'audio';
    const idleText = kind === 'video' ? 'Xem thử' : (kind === 'font' ? 'Thử font' : 'Nghe thử');
    btn.classList.remove('is-loading', 'is-playing');
    if (state === 'loading') {
      btn.classList.add('is-loading');
      btn.innerHTML = `<span class="preview-spinner"></span> Đang tải...`;
    } else if (state === 'playing') {
      btn.classList.add('is-playing');
      btn.innerHTML = `<span class="preview-icon">⏸</span> Dừng`;
    } else {
      btn.innerHTML = `<span class="preview-icon">▶</span> ${idleText}`;
    }
  },

  toggleAudio(src, btn) {
    if (this.activeSrc === src && this.audio && !this.audio.paused) {
      this.stop();
      return;
    }
    this.stop();
    this.activeBtn = btn;
    this.activeSrc = src;
    this.activeKind = 'audio';
    this.setBtnState(btn, 'loading');

    const audio = new Audio();
    this.audio = audio;
    audio.src = src;

    audio.onwaiting = () => this.setBtnState(btn, 'loading');
    audio.onplaying = () => this.setBtnState(btn, 'playing');
    audio.onended = () => this.stop();
    audio.onerror = () => {
      toast('Không thể tải tệp âm thanh. Vui lòng kiểm tra lại đường dẫn.');
      this.stop();
    };

window.MediaPreview = MediaPreview;

    audio.play().then(() => {
      this.setBtnState(btn, 'playing');
    }).catch(err => {
      if (err.name !== 'AbortError') {
        toast('Lỗi phát âm thanh: ' + err.message);
      }
      this.stop();
    });
  },

  toggleVideo(src, btn) {
    const card = btn.closest('.res-card, .asset') || btn.parentElement;
    const video = card ? card.querySelector('video') : null;
    if (this.activeSrc === src && video && !video.paused) {
      video.pause();
      this.stop();
      return;
    }
    this.stop();
    this.activeBtn = btn;
    this.activeSrc = src;
    this.activeKind = 'video';
    this.setBtnState(btn, 'loading');

    if (video) {
      this.videoEl = video;
      video.onwaiting = () => this.setBtnState(btn, 'loading');
      video.onplaying = () => this.setBtnState(btn, 'playing');
      video.onended = () => this.stop();
      video.play().then(() => {
        this.setBtnState(btn, 'playing');
      }).catch(err => {
        toast('Không thể phát video: ' + err.message);
        this.stop();
      });
    } else {
      this.toggleAudio(src, btn);
    }
  },

  toggleFont(fontName, btn) {
    if (this.activeSrc === fontName) {
      this.stop();
      toast('Đã dừng thử font.');
      return;
    }
    this.stop();
    this.activeBtn = btn;
    this.activeSrc = fontName;
    this.setBtnState(btn, 'playing');
    toast('Đang thử font: ' + fontName);
  }
};

function render(){cancelAnimationFrame(frameId);$('#app').innerHTML=`<div class="shell"><aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">${icon('spark')}</div>
        <span class="brand-text">ThreadViral</span>
        <small class="brand-badge">LOCAL</small>
      </div>
      <button class="btn-create-top" data-action="create-page">${icon('plus')} Tạo video mới</button>

      <div class="navhead">Thư viện</div>
      <button class="nav ${route==='videos'?'active':''}" data-action="videos">
        ${icon('video')} Video đã tạo
        <span class="nav-badge-pill">MP4</span>
      </button>
      <button class="nav" data-action="open-voice-panel">
        ${icon('sound')} Thư viện giọng đọc
      </button>
      <button class="nav ${route==='jobs'?'active':''}" data-action="jobs">
        ${icon('grid')} Tác vụ dựng video
      </button>

      <div class="navhead">Sáng tạo</div>
      <button class="nav ${route==='create'?'active':''}" data-action="create-page">
        ${icon('text')} Kịch bản phân cảnh
      </button>
      <button class="nav ${route==='setup'?'active':''}" data-action="setup">
        ${icon('settings')} Cấu hình video 9:16
      </button>
      <button class="nav ${route==='resources'?'active':''}" data-action="resource-page">
        ${icon('folder')} Kho tài nguyên · ${resources.length?resources.length.toLocaleString('vi-VN'):'…'} tệp
      </button>


    </aside><main class="work"><header class="header"><div class="header-group"><button class="icon mobile-menu" data-action="menu" aria-label="Mở menu">${icon('menu')}</button><button data-action="project" aria-label="Quản lý dự án">Dự án ${icon('chevron')}</button><span class="status">${icon('check')}Đã lưu local</span></div><div class="header-group"><div id="render-status-indicator" class="render-status-pill" data-action="videos" style="display:none;"><span class="pulse-indicator-dot"></span><span id="render-status-text">Đang dựng video</span></div><button class="${route==='create'?'active':''}" data-action="create-page">${icon('text')}Kịch bản</button><button class="white" data-action="render">${icon('video')}${jobId?'Tiến trình dựng':'Dựng video'}</button></div></header>${route==='setup'?setupView():route==='create'?createView():route==='resources'?resourcesView():route==='jobs'?jobsView():galleryView()}</main></div>`;if(route==='setup'){fit();updateCard();animate();}else if(route==='jobs'){loadJobs();}else if(route==='videos'){loadVideos();}if(panel)renderPanel();accessibleFields();document.querySelectorAll('.layer-node video,.auto-media-node video').forEach(v=>{if(playing)v.play().catch(()=>{});else v.pause();});}

function galleryView(){
  return `<section class="gallery" id="gallery"><h1>Video đã tạo</h1><p class="note">Đang nạp danh sách video từ máy...</p></section>`;
}
function jobsView(){
  return `<section class="jobs-view">
    <div class="jobs-header">
      <div>
        <h1>${icon('grid')} Tiến trình dựng video (Rendering Pipeline)</h1>
        <p class="note" style="margin:4px 0 0;color:#94a3b8;">Theo dõi thời gian thực tiến trình xuất video MP4 9:16 bằng FFmpeg & Python local trên máy.</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button class="btn-emerald" data-action="render">${icon('video')} ${jobId?'Tiếp tục dựng':'Bắt đầu dựng video mới'}</button>
        <button data-action="setup">${icon('settings')} Về Canvas</button>
      </div>
    </div>
    <div id="jobs-dashboard">
      <p class="note">Đang nạp danh sách tác vụ...</p>
    </div>
  </section>`;
}

function resourcesView(){
  const kinds=[
    ['all','Tất cả'],
    ['background_video','Video nền'],
    ['background_music','Nhạc nền'],
    ['sound_effect','SFX âm thanh'],
    ['sticker','Sticker'],
    ['font','Font chữ'],
    ['voice_preview','Giọng đọc']
  ];
  const filtered=resources.filter(a=>{
    const matchKind=resourceTab==='all'||a.kind===resourceTab;
    const name=(a.metadata?.name||a.metadata?.label||a.local||a.id||'').toLowerCase();
    const matchSearch=!resourceSearch||name.includes(resourceSearch.toLowerCase());
    return matchKind&&matchSearch;
  });
  const totalPages=Math.max(1,Math.ceil(filtered.length/RESOURCE_PAGE_SIZE));
  const pageItems=filtered.slice(resourcePageNum*RESOURCE_PAGE_SIZE,(resourcePageNum+1)*RESOURCE_PAGE_SIZE);

  return `<section class="resources-view">
    <div class="res-head">
      <div>
        <h1>${icon('folder')} Kho tài nguyên Media</h1>
        <p class="note">${filtered.length.toLocaleString('vi-VN')} tài nguyên khả dụng · Nhấp để xem trước và chọn trực tiếp cho video</p>
      </div>
      <div class="res-search-wrap">
        <div class="search-box">${icon('search')}<input type="search" id="res-search-input" placeholder="Tìm tài nguyên..." value="${esc(resourceSearch)}"></div>
        <button class="white" data-action="setup">${icon('check')} Về Canvas</button>
      </div>
    </div>
    <div class="res-tabs">
      ${kinds.map(([k,label])=>`<button class="res-tab ${resourceTab===k?'active':''}" data-action="filter-resource-tab" data-kind="${k}">${label} <small>${k==='all'?resources.length:resources.filter(r=>r.kind===k).length}</small></button>`).join('')}
    </div>
    <div class="res-grid">
      ${pageItems.map(renderResourceCard).join('')||'<div class="empty-res">Không tìm thấy tài nguyên phù hợp.</div>'}
    </div>
    ${totalPages > 1 ? `
    <div class="pagination-centered">
      <button class="btn-page" data-action="res-prev" ${resourcePageNum === 0 ? 'disabled' : ''}>
        ${icon('back')} Trang trước
      </button>
      <div class="page-counter-pill">
        Trang <strong>${resourcePageNum + 1}</strong> / ${totalPages}
      </div>
      <button class="btn-page" data-action="res-next" ${resourcePageNum >= totalPages - 1 ? 'disabled' : ''}>
        Trang sau ${icon('arrow')}
      </button>
    </div>
  ` : ''}
  </section>`;
}

function renderResourceCard(item){
  const rawPath = item.local ? item.local.replace(/^\/+/, '') : '';
  const path = '/' + rawPath;
  const rawName = item.metadata?.name || item.metadata?.label || item.local?.split('/').pop()?.replace(/\.[^/.]+$/, '') || item.id;
  const name = esc(rawName);
  const kind = item.kind;
  let iconName = 'folder';
  let kindTag = '<span class="tag-badge">Tài nguyên</span>';
  let previewBtn = '';
  let actionBtn = '';
  let mediaBox = '';

  if (kind === 'background_video') {
    iconName = 'video';
    kindTag = '<span class="tag-badge video">Video nền 9:16</span>';
    mediaBox = `<div class="res-card-media-box"><video src="${path}" preload="metadata" playsinline muted controls></video></div>`;
    previewBtn = `<button class="btn-preview-state" data-action="preview-media" data-preview-kind="video" data-src="${path}"><span class="preview-icon">▶</span> Xem thử</button>`;
    actionBtn = `<button class="btn-apply-action white" data-action="apply-bg-video" data-src="${esc(item.local)}">+ Dùng Video</button>`;
  } else if (kind === 'background_music') {
    iconName = 'music';
    kindTag = '<span class="tag-badge music">Nhạc nền</span>';
    mediaBox = `<div class="res-card-audio-box"><div style="color:#c084fc;">${icon('music')}</div><div style="font-size:11px;color:#cbd5e1;font-weight:600;">Âm thanh 44.1kHz</div></div>`;
    previewBtn = `<button class="btn-preview-state" data-action="preview-media" data-preview-kind="audio" data-src="${path}"><span class="preview-icon">▶</span> Nghe thử</button>`;
    actionBtn = `<button class="btn-apply-action white" data-action="apply-bgm" data-src="${esc(item.local)}">+ Dùng Nhạc</button>`;
  } else if (kind === 'sound_effect') {
    iconName = 'sound';
    kindTag = '<span class="tag-badge amber">SFX Âm thanh</span>';
    mediaBox = `<div class="res-card-audio-box"><div style="color:#fbbf24;">${icon('sound')}</div><div style="font-size:11px;color:#cbd5e1;font-weight:600;">SFX Chuyển cảnh</div></div>`;
    previewBtn = `<button class="btn-preview-state" data-action="preview-media" data-preview-kind="audio" data-src="${path}"><span class="preview-icon">▶</span> Nghe thử</button>`;
    actionBtn = `<button class="btn-apply-action" data-action="apply-sfx" data-src="${esc(item.local)}">+ Gán SFX</button>`;
  } else if (kind === 'sticker' || kind === 'background_image') {
    iconName = 'spark';
    kindTag = `<span class="tag-badge vi">${kind==='sticker'?'Sticker':'Ảnh nền'}</span>`;
    mediaBox = `<div class="res-card-media-box" style="background:#111728;"><img src="${path}" alt="${name}" loading="lazy"></div>`;
    actionBtn = `<button class="btn-apply-action white" data-action="apply-sticker" data-src="${esc(item.local)}">+ Thêm vào cảnh</button>`;
  } else if (kind === 'font') {
    iconName = 'text';
    kindTag = '<span class="tag-badge purple">Font chữ</span>';
    const fontDisplay = rawName.split('/').pop().replace(/\.[^/.]+$/, '');
    mediaBox = `<div class="res-card-font-box"><div style="font-size:18px;font-weight:700;color:#fff;">Aa Phụ đề 9:16</div><div style="font-size:11px;color:#38bdf8;margin-top:2px;">${esc(fontDisplay)}</div></div>`;
    previewBtn = `<button class="btn-preview-state" data-action="preview-media" data-preview-kind="font" data-font="${esc(fontDisplay)}"><span class="preview-icon">Aa</span> Thử font</button>`;
    actionBtn = `<button class="btn-apply-action" data-action="apply-font" data-font="${esc(fontDisplay)}">+ Áp dụng</button>`;
  } else if (kind === 'voice_preview') {
    iconName = 'sound';
    kindTag = '<span class="tag-badge vi">Mẫu giọng đọc</span>';
    mediaBox = `<div class="res-card-audio-box"><div style="color:#38bdf8;">${icon('sound')}</div><div style="font-size:11px;color:#cbd5e1;font-weight:600;">Mẫu giọng đọc AI</div></div>`;
    previewBtn = `<button class="btn-preview-state" data-action="preview-media" data-preview-kind="audio" data-src="${path}"><span class="preview-icon">▶</span> Nghe thử</button>`;
    actionBtn = `<a href="${path}" download style="flex:none;"><button class="btn-apply-action">${icon('download')}</button></a>`;
  } else {
    iconName = 'folder';
    mediaBox = `<div class="res-card-audio-box"><div style="color:#94a3b8;">${icon('folder')}</div><div style="font-size:11px;color:#94a3b8;">Tài nguyên local</div></div>`;
    actionBtn = `<a href="${path}" download><button class="btn-apply-action">${icon('download')} Tải file</button></a>`;
  }

  const pack = item.metadata?.pack || item.metadata?.category || 'Mặc định';
  const size = item.metadata?.bytes ? Math.round(item.metadata.bytes / 1024) + ' KB' : '';

  return `
    <article class="res-card">
      ${mediaBox}
      <div class="res-card-top">
        <div class="res-card-avatar">
          ${icon(iconName)}
        </div>
        <div class="res-card-meta">
          <div class="res-card-name" title="${name}">
            ${name} <span class="star-badge" style="color:#f59e0b;">★</span>
          </div>
          <div class="res-card-sub" title="${pack} · ${size}">
            ${pack} ${size ? '· ' + size : ''}
          </div>
        </div>
      </div>

      <div class="res-card-tags">
        <span class="tag-badge vi">Tiếng Việt</span>
        ${kindTag}
      </div>

      <div class="res-card-controls">
        ${previewBtn}
        ${actionBtn}
      </div>
    </article>
  `;
}

function createView() {
  return `
  <section class="create-view">
    <div class="create-header">
      <div>
        <h1>${icon('spark')} Kịch bản phân cảnh (Script & Scenes Breakdown)</h1>
        <p class="note" style="margin:4px 0 0;color:#94a3b8;">Hệ thống tự động phân tách bài viết thành từng phân cảnh 9:16, nhận diện cảm xúc và đồng bộ lời đọc AI.</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button class="btn-emerald" data-action="setup">${icon('check')} Sang Cấu hình Video</button>
      </div>
    </div>

    <!-- Step 1: Link & Import matching Image 4 dashed dropzone -->
    <div class="section-step-box">
      <div class="section-step-title">
        ${icon('spark')} 1. Nhập link bài viết Threads hoặc chọn mẫu
      </div>
      <div class="dashed-dropzone">
        <div class="dropzone-icon">
          ${icon('video')}
        </div>
        <div class="dropzone-text">
          Dán link bài viết Threads vào ô bên dưới để trích xuất tự động
        </div>
        <div class="dropzone-sub">
          Hỗ trợ phân tích câu, lọc bình luận chất lượng và tự động chuẩn hóa giọng đọc TTS
        </div>
        <div style="display:flex;gap:10px;width:100%;max-width:720px;flex-wrap:wrap;align-items:center;margin-top:6px;">
          <input id="source-url" placeholder="https://www.threads.net/@user/post/... (Dán link bài viết)" value="${esc(S.source_url || '')}" style="flex:1;min-width:280px;background:#0c121e;border-color:#23344d;">
          <button class="btn-emerald" data-action="fetch-source">${icon('search')} Lấy bài viết</button>
          <button data-action="discover-hot" style="background:#131c2e;border-color:#2a3d5e;color:#a5b4fc;">${icon('spark')} Khám phá Hot</button>
          <button data-action="sample">${icon('copy')} Dùng mẫu</button>
        </div>
      </div>
    </div>

    <!-- Step 2: AI Toolkit & Action Bar -->
    <div class="section-step-box">
      <div class="step-toolbar">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="white" data-action="add-scene">${icon('plus')} Thêm cảnh mới</button>
          <button data-action="analyze-scenes">${icon('settings')} Lọc bình luận AI</button>
          <button data-action="script-scenes">${icon('spark')} Gợi ý kịch bản AI</button>
          <button data-action="normalize-scenes">${icon('sound')} Chuẩn hóa đọc TTS</button>
        </div>
        <div class="tag-badge video" style="font-size:11px;padding:6px 14px;border-radius:20px;">
          ✓ ${S.scenes.length} phân cảnh (${S.scenes.filter(s => s.selected !== false).length} đang bật)
        </div>
      </div>
    </div>

    <!-- Step 3: Scene List -->
    <div class="section-step-box">
      <div class="section-step-title">
        ${icon('text')} 3. Danh sách phân cảnh chi tiết (${S.scenes.length} cảnh)
      </div>
      <div id="scene-list" class="scene-list-full">
        ${sceneList()}
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;padding:16px 0;">
      <button class="btn-emerald" data-action="setup" style="padding:14px 28px;font-size:14px;">
        ✨ Hoàn tất kịch bản & Sang Cấu hình Video
      </button>
    </div>
  </section>`;
}

function setupView(){const layers=S.style.layers.filter(l=>l.section===section);return `<div class="editor"><section class="canvas-area"><div class="tools">${[['text','Chữ'],['image','Ảnh'],['shape','Hình'],['spark','Meme + SFX'],['video','B-roll']].map(([ic,n])=>`<button class="tool" data-action="tool-${ic}">${icon(ic)}${n}</button>`).join('')}<hr>${[['cover','Bìa'],['hook','Mở đầu'],['body','Thân']].map(([id,n])=>`<button class="tool section ${section===id?'active':''}" data-section="${id}">${n}</button>`).join('')}</div><div class="canvas-actions"><div class="undo"><button class="icon" data-action="undo" aria-label="Hoàn tác" ${!undo.length?'disabled':''}>${icon('undo')}</button><button class="icon" data-action="redo" aria-label="Làm lại" ${!redo.length?'disabled':''}>${icon('redo')}</button></div><button class="white" data-action="play">${icon(playing?'pause':'play')}${playing?'Dừng thử':'Phát thử'}</button></div><div class="stage-wrap"><div class="stage"><div class="design ${playing?'playing':''}" id="design"><canvas id="backdrop" width="360" height="640"></canvas><div class="layer-node ${selected==='card'?'selected':''}" data-layer="card" id="card-node" style="display:${section==='body'?'block':'none'};left:${(100-S.style.card_width)/2}%;top:${S.style.card_y}%;width:${S.style.card_width}%"><iframe id="card-preview" title="Threads card preview" sandbox="allow-same-origin"></iframe></div>${section!=='body'?`<div class="section-title-node" style="font-size:${section==='cover'?80:64}px">${esc(section==='cover'?(S.style.cover_title||activeScene().display_text):(S.style.hook_text||'Thêm lời mở đầu trong Khung hình'))}</div>`:''}${subtitleNode(S.style,section,selected,activeScene().tts_text||activeScene().display_text)}${layers.map(layerNode).join('')}${autoMediaNodes(activeScene(),section)}</div></div><div class="preview-scrub"><input type="range" aria-label="Thời điểm xem trước" id="preview-seek" min="0" max="${previewDuration()}" step=".05" value="${previewCursor}"><small id="preview-clock">${previewCursor.toFixed(1)}s / ${previewDuration().toFixed(1)}s · ước tính</small></div><div class="zoom"><button data-action="zoom-in" aria-label="Phóng to">${icon('plus')}</button><small>${Math.round(zoom*95)}%</small><button data-action="zoom-out" aria-label="Thu nhỏ">${icon('minus')}</button><button data-action="fit" aria-label="Vừa khung">${icon('expand')}</button><button data-panel="background" aria-label="Khung hình và nền">${icon('image')}</button></div></div></section><aside class="layers"><div class="layers-title"><span>Lớp (${layers.length+(section==='body'?2+(activeScene().studio_media?.enabled!==false?Number(Boolean(activeScene().studio_media?.broll_source))+Number(Boolean(activeScene().studio_media?.sticker_source)):0):0)}/20)</span><small>kéo để sắp xếp</small></div><div class="layer-actions"><button data-action="add-text">${icon('plus')}Thêm lớp</button><button data-action="duplicate">${icon('copy')}Sao chép lớp</button></div>${[...layers].reverse().map(l=>`<div class="layer-row ${selected===l.id?'active':''}" data-select="${l.id}" draggable="true" data-drag-layer="${l.id}"><span class="grip">${icon('grip')}</span>${icon(l.kind==='text'?'text':l.kind==='video'?'video':l.kind==='image'?'image':'shape')}<span class="name">${esc(l.name)}</span><button data-action="delete-layer" data-id="${l.id}" aria-label="Xóa lớp">${icon('trash')}</button></div>`).join('')}${section==='body'?`<div class="layer-row ${selected==='subtitle'?'active':''}" data-select="subtitle"><span class="grip">${icon('grip')}</span>${icon('text')}<span class="name">Subtitle</span><span class="lock">${icon('lock')} Cố định</span></div><div class="layer-row ${selected==='card'?'active':''}" data-select="card"><span class="grip">${icon('grip')}</span>${icon('image')}<span class="name">Ảnh chụp bài viết</span><span class="lock">${icon('lock')} Cố định</span></div>`:''}<button style="width:100%;margin-top:15px" data-action="copy-hook">Sao chép từ ${section==='body'?'Hook':'Thân'}</button>${section==='body'&&activeScene().studio_media?`<p class="note">Minh họa theo cảnh · ${activeScene().studio_media.origin==='ai_import'?'AI nhập':'gợi ý local'}<br>${esc(activeScene().studio_media.reason)}<br><button data-panel="automation">Chỉnh gợi ý</button></p>`:''}<div id="properties">${properties()}</div></aside></div><footer class="dock">${Object.entries(names).map(([k,n])=>`<button class="dock-card ${panel===k?'active':''}" data-panel="${k}"><strong>${n}</strong><small>${dockDescriptions[k]}</small><span class="value">${esc(dockValue(k))}</span>${icon(({background:'image',voice:'sound',music:'sound',card:'image',subtitle:'text',content:'text',frame:'grid',sticker:'spark'})[k]||'settings')}</button>`).join('')}</footer>`;}
function layerNode(l){let inner=l.kind==='video'?`<video src="${esc(l.source)}" muted loop playsinline preload="metadata" style="width:100%;height:100%;object-fit:contain;pointer-events:none"></video>`:l.kind==='image'?`<img src="${esc(l.source)}" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`:l.kind==='shape'?'':esc(l.text);return `<div class="layer-node motion-${l.motion||'none'} ${selected===l.id?'selected':''}" data-layer="${l.id}" data-start="${l.start_seconds||0}" data-end="${l.end_seconds??''}" style="left:${l.x}%;top:${l.y}%;width:${l.width}%;height:${l.height}%;color:${l.kind==='shape'?'transparent':l.color};background:${l.kind==='shape'?l.color:'transparent'};font-size:${l.size}px;opacity:${l.opacity};font-family:Baloo,Arial;overflow:hidden;white-space:pre-wrap;border-radius:${l.kind==='shape'?12:0}px">${inner}</div>`;}
function range(label,key,value,min,max,step=1,layer=false){return `<label>${label} <small>${value}</small></label><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-${layer?'layer-prop':'style'}="${key}" aria-label="${label}">`;}
function toggle(label,key,value){return `<label class="switch-row">${label}<input type="checkbox" data-style="${key}" ${value?'checked':''}></label>`;}
function properties(){if(section!=='body'&&['card','subtitle'].includes(selected))return `<div class="properties"><h3>${section==='cover'?'Bìa video':'Lời mở đầu'}</h3><p class="note">Chỉnh tiêu đề và thời lượng ở Khung hình. Các lớp thêm tại đây chỉ xuất hiện trong phần này.</p><button data-panel="frame">${icon('settings')}Mở cấu hình</button></div>`;const l=S.style.layers.find(l=>l.id===selected);return `<div class="properties"><h3>${selected==='card'?'Ảnh chụp bài viết':selected==='subtitle'?'Phụ đề':esc(l?.name||'Chọn một lớp')}</h3>${selected==='card'?range('Bề rộng thẻ (%)','card_width',S.style.card_width,35,100)+range('Vị trí dọc (%)','card_y',S.style.card_y,0,80):selected==='subtitle'?range('Vị trí phụ đề (%)','subtitle_y',S.style.subtitle_y,10,94)+range('Cỡ chữ','subtitle_size',S.style.subtitle_size,20,90):l?`${l.kind==='text'?`<label>Nội dung chữ</label><textarea data-layer-prop="text">${esc(l.text)}</textarea>`:''}${['text','shape'].includes(l.kind)?`<label>Màu</label><input type="color" data-layer-prop="color" value="${l.color}">`:''}${l.kind==='text'?`<label>Cỡ chữ</label><input type="number" data-layer-prop="size" value="${l.size}" min="12" max="160">`:''}${range('Vị trí X (%)','x',l.x,0,95,1,true)}${range('Vị trí Y (%)','y',l.y,0,95,1,true)}${range('Rộng (%)','width',l.width,2,100,1,true)}${range('Cao (%)','height',l.height,1,100,1,true)}${range('Độ đậm','opacity',l.opacity,0,1,.05,true)}<div class="two"><div><label>Bắt đầu (giây)</label><input aria-label="Bắt đầu (giây)" type="number" min="0" max="300" step=".1" data-layer-prop="start_seconds" value="${l.start_seconds||0}"></div><div><label>Kết thúc (giây)</label><input aria-label="Kết thúc (giây)" type="number" min=".1" max="300" step=".1" data-layer-prop="end_seconds" placeholder="Hết cảnh" value="${l.end_seconds??''}"></div></div><label>Chuyển động khi vào cảnh</label><select data-layer-prop="motion">${[['none','Tĩnh'],['fade','Hiện dần'],['rise','Trồi lên'],['slide','Trượt vào']].map(([v,n])=>`<option value="${v}" ${(l.motion||'none')===v?'selected':''}>${n}</option>`).join('')}</select>`:'<small>Bấm vào canvas hoặc tên lớp để chỉnh.</small>'}</div>`;}
function fit(){const area=$('.canvas-area');if(!area)return;const h=Math.min(area.clientHeight-95,(area.clientWidth-155)*16/9)*zoom;const height=Math.max(200,h),width=height*9/16;$('.stage-wrap').style.cssText=`height:${height}px;width:${width}px`;$('.design').style.transform=`scale(${width/1080})`;}
async function updateCard(){if(section!=='body')return;const iframe=$('#card-preview');if(!iframe)return;const version=++cardVersion;try{const r=await fetch('/api/studio/card',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scene:activeScene(),style:S.style})});if(!r.ok)throw Error('Không tải được thẻ preview.');const html=await r.text();if(version!==cardVersion||!$('#card-preview'))return;iframe.onload=()=>{try{const ratio=1080*S.style.card_width/100/520;iframe.style.cssText=`width:520px;height:${Math.ceil(iframe.contentDocument.querySelector('.card').getBoundingClientRect().height)}px;transform:scale(${ratio})`;$('#card-node').style.height=(Math.ceil(iframe.contentDocument.querySelector('.card').getBoundingClientRect().height)*ratio)+'px';}catch{}};iframe.srcdoc=html;}catch(e){toast(e.message);}}
function drawBackground(canvas,t,mode=S.style.background_mode,color=S.style.grid_color){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.fillStyle='#05050c';c.fillRect(0,0,w,h);c.strokeStyle=color+'70';c.fillStyle=color;c.lineWidth=1;let u=w/9;function line(points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}if(['grid','water','wave3d'].includes(mode)){for(let i=-2;i<23;i++){let y=i*u+t*u*.22%u;if(mode==='wave3d')y=h*.25+(i*u+t*u*.22%u)*.7;line(Array.from({length:121},(_,j)=>{let x=j*w/120;return[x,y+(mode!=='grid'?Math.sin(x/w*8+t*1.5+i*.45)*u*(mode==='water'?.28:.5):0)];}));}for(let i=0;i<11;i++)line(Array.from({length:160},(_,j)=>{let y=j*h/159;return[i*u+(mode!=='grid'?Math.sin(y/h*9+t+i*.4)*u*.18:0),y];}));}else if(mode==='contours'){for(let i=1;i<24;i++){let r=i*w*.04;line(Array.from({length:181},(_,j)=>{let a=j*Math.PI/90;return[w/2+Math.cos(a)*r*(1+.13*Math.sin(a*3+t)),h/2+Math.sin(a)*r*1.5*(1+.12*Math.cos(a*4+t))];}));}}else if(mode==='waves'){for(let i=0;i<25;i++)line(Array.from({length:121},(_,j)=>{let x=j*w/120;return[x,h*.5+Math.sin(x/w*5+t*.7+i*.17)*(40+i*3)+i*7-90];}));}else if(mode==='tunnel'){for(let i=0;i<16;i++){const k=((i/16+t*.12)%1)**2;c.strokeRect(w/2-w*k/2,h/2-h*k/2,w*k,h*k);}}else{let nodes=[];for(let i=0;i<75;i++){let x,y;if(['dust','lightspeed'].includes(mode)){let a=i*2.399+t*.07,r=(i*.137+t*.1)%1*w*.9;x=w/2+Math.cos(a)*r;y=h/2+Math.sin(a)*r*h/w;}else{x=(i*73.7+Math.sin(t*.7+i)*18)%w;y=((i*117.1-t*(8+i%5*4))%h+h)%h;}nodes.push([x,y]);if(mode==='rain')line([[x,y],[x,y+8+i%20]]);else if(mode==='lightspeed')line([[x,y],[x+(x-w/2)*.1,y+(y-h/2)*.1]]);else{c.beginPath();c.arc(x,y,1+i%2,0,Math.PI*2);c.fill();}}if(mode==='network')for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1])<w*.15)line([nodes[i],nodes[j]]);}}
let backgroundImage=null,backgroundVideo=null;
function animate(){const canvas=$('#backdrop');if(!canvas)return;const mode=S.style.background_mode,t=playing?((performance.now()-previewStarted)/1000)%previewDuration():previewCursor;updateSubtitlePreview($('.subtitle-node'),S.style,activeScene().tts_text||activeScene().display_text,t,previewDuration());const seek=$('#preview-seek');if(seek&&playing)seek.value=t;const clock=$('#preview-clock');if(clock)clock.textContent=t.toFixed(1)+'s / '+previewDuration().toFixed(1)+'s · ước tính';document.querySelectorAll('.layer-node[data-start]').forEach(node=>{const start=Number(node.dataset.start)||0,end=node.dataset.end===''?Infinity:Number(node.dataset.end);node.style.visibility=t>=start&&t<end?'visible':'hidden';const v=node.querySelector('video');if(v)syncPreviewVideo(v,t-start,t>=start&&t<end);});document.querySelectorAll('.auto-media-node video').forEach(v=>syncPreviewVideo(v,t));drawBackground(canvas,t,mode);if(mode==='image'&&S.style.background_image){if(backgroundImage?.src.endsWith(S.style.background_image)&&backgroundImage.complete){cover(canvas,backgroundImage);}else if(!backgroundImage||!backgroundImage.src.endsWith(S.style.background_image)){backgroundImage=new Image();backgroundImage.src=S.style.background_image;}}if(mode==='video'&&S.bg&&S.bg!=='random'){if(!backgroundVideo||backgroundVideo.dataset.file!==S.bg){backgroundVideo?.pause();backgroundVideo=document.createElement('video');backgroundVideo.muted=true;backgroundVideo.loop=true;backgroundVideo.src='/backgrounds/'+encodeURIComponent(S.bg);backgroundVideo.dataset.file=S.bg;if(playing)backgroundVideo.play().catch(()=>{});}if(backgroundVideo.dataset.previewPlaying!==String(playing)){backgroundVideo.dataset.previewPlaying=String(playing);if(playing)backgroundVideo.play().catch(()=>{});else backgroundVideo.pause();}syncPreviewVideo(backgroundVideo,t);if(backgroundVideo.readyState>=2)cover(canvas,backgroundVideo);}if(mode!=='video')backgroundVideo?.pause();document.querySelectorAll('.preset canvas').forEach(c=>drawBackground(c,t,c.dataset.mode));frameId=requestAnimationFrame(animate);}
function cover(canvas,img){const c=canvas.getContext('2d'),w=img.videoWidth||img.width,h=img.videoHeight||img.height;if(!w||!h)return;const scale=Math.max(canvas.width/w,canvas.height/h);c.drawImage(img,(canvas.width-w*scale)/2,(canvas.height-h*scale)/2,w*scale,h*scale);}
function openPanel(id){panel=id;assetPage=0;assetQuery='';renderPanel();}
function renderPanel(){document.querySelector('.popover')?.querySelectorAll('audio,video').forEach(m=>m.pause());document.querySelector('.popover')?.remove();document.querySelector('.backdrop')?.remove();if(!panel)return;const wrap=document.createElement('div');wrap.className='backdrop';wrap.dataset.action='close-panel';document.body.append(wrap);const p=document.createElement('section');p.className='popover';p.setAttribute('aria-label',names[panel]||'Tài nguyên');p.innerHTML=`<div class="popover-head"><span>${names[panel]||'Kho tài nguyên'}</span><button data-action="close-panel" aria-label="Đóng tùy chọn">${icon('close')}</button></div>${panelBody()}`;document.body.append(p);accessibleFields(p);}
function panelBody(){const c=S.style;if(panel==='automation')return automationPanel(S);if(panel==='background')return `<div class="chips">${[['grid','Nền động'],['image','Ảnh nền'],['video','Kho video']].map(([id,n])=>`<button class="chip ${(id==='grid'&&modes[c.background_mode])||id===c.background_mode?'active':''}" data-bg-type="${id}">${n}</button>`).join('')}</div>${modes[c.background_mode]?`<div class="preset-grid">${Object.entries(modes).map(([id,n])=>`<button class="preset ${c.background_mode===id?'active':''}" data-mode="${id}"><canvas width="180" height="100" data-mode="${id}"></canvas><span>${n}</span></button>`).join('')}</div><label>Màu lưới / hạt</label><input type="color" data-style="grid_color" value="${c.grid_color}">`:`<button data-action="pick-background">${icon('folder')}Chọn ${c.background_mode==='image'?'ảnh':'video'} từ kho local</button>`}<p class="note">11 nền động được tạo bằng code tại máy và dùng khi xuất MP4.</p>`;if(panel==='card')return `<label>Giao diện thẻ</label><select data-style="theme"><option value="light" ${c.theme==='light'?'selected':''}>Card sáng</option><option value="dark" ${c.theme==='dark'?'selected':''}>Card tối</option></select>${range('Bề rộng thẻ (%)','card_width',c.card_width,35,100)}${range('Vị trí dọc (%)','card_y',c.card_y,0,80)}${toggle('Ẩn ngày đăng','hide_date',c.hide_date)}${toggle('Ẩn avatar','hide_avatar',c.hide_avatar)}${toggle('Làm mờ tên tài khoản','blur_identity',c.blur_identity)}${toggle('Làm mờ avatar','blur_avatar',c.blur_avatar)}<label>Từ cần làm mờ, ngăn bởi dấu phẩy</label><input data-style="redact_words" value="${esc(c.redact_words)}"><p class="note">HTML/CSS thẻ dùng chung cho preview và bản chụp Chromium khi xuất video.</p>`;if(panel==='subtitle')return subtitlePanel(c);if(panel==='music')return `<button data-action="pick-music">${icon('sound')}Chọn nhạc từ kho đã tải</button><p class="note">${esc(S.bgm||'Không dùng nhạc nền')}</p><button data-action="music-off">Tắt nhạc</button>${range('Âm lượng nhạc','volume',S.volume,0,.5,.01)}<p class="note">Các bài trong kho crawl là đoạn preview, được lặp khi video dài hơn.</p>`;if(panel==='voice')return voicePanel(S,icon);if(panel==='content')return `<button data-action="source">${icon('text')}Mở bài viết & bình luận</button><p class="note">${S.scenes.length} cảnh trong dự án · ${S.scenes.filter(s=>s.selected!==false).length} cảnh được chọn.</p>`;if(panel==='brand'||panel==='signature')return `<label>Chữ ký / watermark</label><input data-setting="watermark" value="${esc(S.watermark)}" placeholder="Tên kênh của bạn"><button style="margin-top:15px" data-action="add-logo">${icon('plus')}Thêm tên kênh thành lớp chữ</button>`;if(panel==='frame')return `${toggle('Bật cảnh bìa','cover_enabled',c.cover_enabled)}<label>Tiêu đề bìa</label><textarea data-style="cover_title" maxlength="250">${esc(c.cover_title||'')}</textarea>${range('Thời lượng bìa (giây)','cover_seconds',c.cover_seconds||2,.5,8,.5)}<label>Lời mở đầu · có giọng đọc</label><textarea data-style="hook_text" maxlength="500">${esc(c.hook_text||'')}</textarea><label>Lời kết · có giọng đọc</label><textarea data-style="outro_text" maxlength="500">${esc(c.outro_text||'')}</textarea><label>Chuyển cảnh</label><select data-style="transition">${[['cut','Cắt thẳng'],['fade','Hiện dần'],['rise','Trồi lên']].map(([v,n])=>`<option value="${v}" ${c.transition===v?'selected':''}>${n}</option>`).join('')}</select><label>Chất lượng dựng</label><select data-setting="resolution"><option ${S.resolution==='1080x1920'?'selected':''}>1080x1920</option><option ${S.resolution==='720x1280'?'selected':''}>720x1280</option></select><p class="note">Mỗi bình luận một cảnh. Kéo lớp trực tiếp trên canvas hoặc chỉnh tọa độ trong bảng Lớp.</p>`;if(panel==='sticker')return `<p class="note">SFX: ${esc(c.sfx_source?.split('/').pop()||'Tắt')}</p>${range('Âm lượng SFX','sfx_volume',c.sfx_volume??.12,0,.5,.01)}<button data-action="sfx-off">Tắt SFX</button><button data-action="pick-sticker">${icon('spark')}Chọn trong 453 sticker</button><button style="margin-top:10px" data-action="pick-sfx">${icon('sound')}Chọn SFX chuyển cảnh</button><p class="note">Sticker được gắn thành lớp ảnh trong video. SFX đã chọn phát ngắn ở đầu mỗi cảnh sau cảnh đầu. Không tự suy đoán cảm xúc.</p>`;if(panel==='assets')return assetPicker();return '';}
function assetPicker(){
  let rows=resources.filter(a=>a.kind===resourceKind&&((a.metadata?.name||a.metadata?.label||a.local).toLowerCase().includes(assetQuery.toLowerCase()))),limit=24;
  const pages=Math.max(1,Math.ceil(rows.length/limit));
  assetPage=Math.min(assetPage,pages-1);
  return `<input type="search" id="asset-search" aria-label="Tìm tài nguyên" placeholder="Tìm tài nguyên…" value="${esc(assetQuery)}">
    <p class="note">${rows.length} tệp local · Trang ${assetPage+1}/${pages}</p>
    <div class="asset-grid" style="grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:12px;">
      ${rows.slice(assetPage*limit,(assetPage+1)*limit).map(a=>{
        let src='/'+a.local.replace(/^\/+/,''), n=a.metadata?.name||a.metadata?.label||a.local.split('/').pop().replace(/\.[^/.]+$/, '');
        let isAudio = a.kind==='background_music'||a.kind==='sound_effect';
        let isVideo = a.kind==='background_video';
        return `<div class="asset" style="background:#0e1424;border:1.5px solid #23304a;border-radius:10px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">
          ${isVideo ? `<div style="width:100%;aspect-ratio:16/9;background:#000;border-radius:6px;overflow:hidden;"><video src="${src}" preload="metadata" muted playsinline style="width:100%;height:100%;object-fit:cover;"></video></div>` :
            !isAudio ? `<div style="width:100%;aspect-ratio:1;background:#131c30;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;"><img src="${src}" loading="lazy" alt="${esc(n)}" style="max-width:100%;max-height:100%;object-fit:contain;"></div>` :
            `<div style="display:flex;align-items:center;gap:8px;"><div style="width:32px;height:32px;border-radius:6px;background:#162035;display:flex;align-items:center;justify-content:center;color:#38bdf8;">${icon('music')}</div><div style="font-size:10px;color:#94a3b8;">${esc(a.metadata?.pack||'Audio')}</div></div>`}
          <div class="name" title="${esc(n)}" style="font-weight:700;font-size:12px;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(n)} ★</div>
          <div style="display:flex;gap:6px;">
            ${(isAudio || isVideo) ? `<button class="btn-preview-state" data-action="preview-media" data-preview-kind="${isVideo?'video':'audio'}" data-src="${src}" style="flex:1;font-size:11px;padding:6px 8px;"><span class="preview-icon">▶</span> ${isVideo?'Xem thử':'Nghe thử'}</button>` : ''}
            <button class="btn-apply-action white" data-action="use-asset" data-local="${esc(a.local)}" style="${(isAudio || isVideo)?'flex:none;':'width:100%;'}font-size:11px;padding:6px 12px;">Dùng</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="chips" style="margin-top:10px;">
      <button data-action="asset-prev" ${assetPage===0?'disabled':''}>${icon('back')}Trước</button>
      <button data-action="asset-next" ${assetPage+1>=pages?'disabled':''}>Sau ${icon('arrow')}</button>
    </div>`;
}
function choose(kind,context){resourceKind=kind;insertContext=context;assetPage=0;assetQuery='';openPanel('assets');}
function addLayer(kind,source=''){if(S.style.layers.length>=17){toast('Tối đa 20 lớp, gồm các lớp cố định.');return;}snapshot();const l={id:crypto.randomUUID(),kind,name:kind==='text'?'Chữ mới':kind==='shape'?'Hình chữ nhật':kind==='video'?'Video B-roll':'Ảnh / sticker',text:kind==='text'?'Nội dung của bạn':'',source,x:10,y:kind==='text'?12:35,width:kind==='text'?80:30,height:kind==='text'?10:20,size:44,color:kind==='shape'?'#5740b2':'#ffffff',opacity:1,section};S.style.layers.push(l);selected=l.id;persist();render();}
function sourceDialog(){closePanel();dialog('Nội dung & bình luận bài viết',`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;"><label style="margin:0;font-weight:600;">Link bài viết Threads</label><button data-action="discover-hot" style="background:#1e1b4b;border-color:#3730a3;color:#a5b4fc;padding:5px 10px;font-size:11px;">${icon('search')} Khám phá bài Hot</button></div><div class="two" style="grid-template-columns:1fr auto;margin-bottom:8px"><input id="source-url" placeholder="https://www.threads.net/@user/post/…"><button class="white" data-action="scrape">${icon('arrow')} Đọc bài viết</button></div><div class="chips" style="margin-bottom:10px;"><button data-action="sample">${icon('copy')} Dùng mẫu</button><button data-action="add-scene">${icon('plus')} Thêm cảnh</button><button data-action="analyze-scenes">${icon('settings')} Lọc bình luận</button><button data-action="script-scenes">${icon('spark')} Gợi ý kịch bản</button><button data-action="normalize-scenes">${icon('sound')} Chuẩn hóa TTS</button></div><div id="scene-list" style="max-height:360px;overflow-y:auto;padding-right:4px;">${sceneList()}</div><p class="note" style="margin-top:10px;">Nội dung hiển thị và lời đọc được sửa riêng. Chọn cảnh để đưa vào video.</p><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;"><button class="white" data-action="save-scenes">${icon('check')} Lưu & về Canvas</button></div>`);}
function openDiscoverDialog(){
  dialog('Khám phá bài viết Hot Threads', `
    <div class="discover-input-wrap">
      <input id="discover-kw" placeholder="Nhập từ khóa tìm bài hot (hoặc để trống để quét ngẫu nhiên)..." class="discover-input">
      <button class="btn-emerald discover-btn" data-action="do-discover">
        ${icon('search')} Quét bài viết
      </button>
    </div>
    <div id="discover-results">
      <div style="text-align:center;padding:32px 10px;color:#64748b;font-size:12px;">
        Nhập từ khóa hoặc nhấn "Quét bài viết" để quét các bài thảo luận nổi bật nhất trên Threads qua Playwright.
      </div>
    </div>
  `);
}

function refreshScenes() {
  if (route === 'create') {
    const list = $('#scene-list');
    if (list) {
      list.innerHTML = sceneList();
      accessibleFields(list);
      const badge = document.querySelector('.scene-count-badge');
      if (badge) badge.textContent = `${S.scenes.length} phân cảnh (${S.scenes.filter(s => s.selected !== false).length} được chọn)`;
    } else {
      render();
    }
  } else {
    sourceDialog();
  }
}

function sceneList(){
  return S.scenes.map((s, i) => `
    <article class="scene-card">
      <div class="scene-card-topbar">
        <label class="custom-checkbox-wrap" title="Bật / Tắt phân cảnh này">
          <input type="checkbox" data-scene="${i}" data-key="selected" ${s.selected!==false?'checked':''} aria-label="Chọn cảnh ${i+1}">
          <span class="custom-checkmark"></span>
        </label>
        <span class="scene-idx-badge">Phân cảnh ${i + 1}</span>
        <div class="scene-author-wrap">
          <span class="author-prefix">@</span>
          <input type="text" class="scene-author-input" data-scene="${i}" data-key="author" value="${esc(s.author)}" placeholder="Tác giả" aria-label="Tác giả cảnh ${i+1}">
        </div>
        <div class="scene-btn-group">
          <button class="btn-scene-action" data-action="preview-scene" data-index="${i}" title="Xem trước khung hình">${icon("eye")} Xem trước</button>
          <button class="btn-scene-action" data-action="scene-up" data-index="${i}" title="Đưa cảnh lên" ${i===0?'disabled':''}>${icon('up')}</button>
          <button class="btn-scene-action danger" data-action="scene-delete" data-index="${i}" title="Xóa cảnh">${icon('trash')}</button>
        </div>
      </div>

      ${s.studio_media ? `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#0d182b;border:1px solid #1a2c47;border-radius:8px;padding:8px 12px;">
          <label style="display:flex;align-items:center;gap:8px;margin:0;font-size:11px;font-weight:600;color:#38bdf8;">
            <input type="checkbox" data-scene="${i}" data-key="media_enabled" ${s.studio_media.enabled!==false?'checked':''}>
            Sử dụng B-roll minh họa cho cảnh này
          </label>
          <span class="tag-badge video" style="font-size:10px;">${esc(s.studio_media.reason || 'B-roll')}</span>
        </div>
      ` : ''}

      <div class="scene-field-group">
        <label class="scene-field-label">Nội dung hiển thị trên video (Card Text)</label>
        <textarea data-scene="${i}" data-key="display_text" placeholder="Nhập nội dung hiển thị trên video...">${esc(s.display_text)}</textarea>
      </div>

      <div class="scene-field-group">
        <label class="scene-field-label">Lời đọc giọng AI (TTS Script)</label>
        <textarea data-scene="${i}" data-key="tts_text" placeholder="Nhập lời đọc tiếng Việt cho phân cảnh...">${esc(s.tts_text)}</textarea>
      </div>
    </article>
  `).join('') || '<div class="section-step-box" style="text-align:center;padding:30px;color:#64748b;">Chưa có phân cảnh nào. Hãy dán link Threads hoặc bấm "Thêm cảnh mới".</div>';
}

function closePanel(){panel=null;document.querySelector('.popover')?.querySelectorAll('audio,video').forEach(m=>m.pause());document.querySelector('.popover')?.remove();document.querySelector('.backdrop')?.remove();}
async function loadVideos(){
  try{
    const [j, jobsRes] = await Promise.all([
      api('/api/storage'),
      api('/api/jobs').catch(() => ({ jobs: [] }))
    ]);
    if(!$('#gallery'))return;

    const activeJobs = (jobsRes.jobs || []).filter(jb => ['running', 'queued'].includes(jb.status));
    updateRenderIndicator(activeJobs.length);

    let activeCardsHtml = activeJobs.map(job => {
      const pct = Math.round((job.progress || 0.1) * 100);
      const stage = esc(job.error || job.message || 'Đang tạo âm thanh và kết xuất khung hình FFmpeg...');
      return `
        <article class="asset active-render-card">
          <div class="appstore-download-frame">
            <div class="appstore-ring-box">
              <div class="appstore-spinner"></div>
              <div class="appstore-ring-val">${pct}%</div>
            </div>
            <div style="font-weight:800;font-size:14px;color:#f8fafc;margin-top:12px;">Đang kết xuất video 9:16</div>
            <div class="appstore-stage-text">${stage}</div>
          </div>
          <div style="padding:14px;">
            <div class="name" style="font-size:12px;font-weight:700;color:#10b981;">Tác vụ: ${esc(job.job_id)}</div>
            <div class="job-progress-bar" style="margin:8px 0 12px;height:6px;">
              <div class="job-progress-fill" style="width:${pct}%;"></div>
            </div>
            <button class="white" data-action="jobs" style="width:100%;font-size:11px;padding:8px 10px;">
              ${icon('grid')} Xem chi tiết tác vụ
            </button>
          </div>
        </article>
      `;
    }).join('');

    $('#gallery').innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
        <div>
          <h1 style="display:flex;align-items:center;gap:10px;margin:0 0 4px;font-size:20px;font-weight:800;">
            ${icon('video')} Bộ sưu tập video đã xuất
          </h1>
          <div style="font-size:12px;color:#94a3b8;">
            ${j.video_count} video MP4 sẵn sàng · ${j.outputs_mb} MB dung lượng · Tự động dọn dẹp sau 24h
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <button data-action="clean-storage" style="color:#f87171;border-color:#5c1d24;background:#1e1114;">
            ${icon('trash')} Dọn dẹp video cũ
          </button>
          <button class="btn-emerald" data-action="setup">${icon('check')} Về Canvas</button>
        </div>
      </div>
      <div class="asset-grid">
        ${activeCardsHtml}
        ${j.videos.map(v=>`
          <article class="asset">
            <video src="/outputs/${encodeURIComponent(v.filename)}" controls preload="metadata" style="width:100%;aspect-ratio:9/16;background:#000;max-height:240px;object-fit:contain;"></video>
            <div style="padding:12px 14px;">
              <div class="name" title="${esc(v.filename)}" style="font-size:12px;font-weight:700;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.filename)}</div>
              <small style="color:#8d8d91;display:block;margin:4px 0 8px;">${v.size_mb} MB · Định dạng MP4 9:16</small>
              <div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
                <a href="/outputs/${encodeURIComponent(v.filename)}" download style="flex:1;">
                  <button class="btn-emerald" style="width:100%;font-size:12px;padding:9px 14px;white-space:nowrap;">
                    ${icon('download')} Tải video MP4
                  </button>
                </a>
                <button data-action="delete-video" data-filename="${esc(v.filename)}" style="background:#261217;border:1.5px solid #6b1f28;color:#f87171;padding:9px 12px;border-radius:8px;flex-shrink:0;" title="Xóa video">${icon('trash')}</button>
              </div>
            </div>
          </article>
        `).join('')|| (activeJobs.length ? '' : '<div class="section-step-box" style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#64748b;">Chưa có video nào trong outputs/. Bấm "Tạo video mới" để bắt đầu dựng.</div>')}
      </div>`;
  }catch(e){toast(e.message);}
}

function renderRequest(){return {scenes:S.scenes.filter(s=>s.selected!==false),voice:S.voice,speed:S.speed,watermark_text:S.watermark,moving_watermark:false,bg_video_path:S.bg,bgm_path:S.bgm,bgm_volume:S.volume,resolution:S.resolution,smart_filter:false,auto_hook:false,hook_text:S.style.hook_text||'',cta_text:S.style.outro_text||'',skip_qc:true,zoom_effect:false,studio_silent:S.silent,studio_style:{...S.style,enabled:true,section:'body'}};}
async function renderVideo(){
  if(submitting)return;
  const request=renderRequest();
  if(!request.scenes.length){
    route='create';
    render();
    toast('Vui lòng thêm nội dung kịch bản trước khi dựng video.');
    return;
  }
  submitting=true;
  closePanel();
  try{
    const check=await api('/api/studio/preflight',request);
    if(!check.ok)throw Error(check.errors.join(' · '));
    const result=await api('/api/render',request);
    jobId=result.job_id;
    localStorage.setItem('tv-studio-job',jobId);
    
    // Switch to videos gallery immediately (App Store downloading style)
    route='videos';
    render();
    watchJob(jobId);
    toast('Đã bắt đầu dựng video! Xem tiến trình trực tiếp tại trang Video đã tạo.');
  }catch(e){
    toast('Chưa thể dựng video: ' + e.message);
  }finally{
    submitting=false;
  }
}

function showJob(){const button=document.querySelector('[data-action="render"]');if(button)button.innerHTML=icon('video')+'Tiến trình dựng';dialog('Tiến trình dựng video','<div class="progress"><span id="job-bar" style="width:0"></span></div><p id="job-label" class="note">Đang kết nối…</p><p class="note">Bạn có thể đóng bảng hoặc tải lại trang. Tác vụ vẫn tiếp tục ở server.</p>');}
let watchedJob=null,jobTimer=null;
async function watchJob(id){if(watchedJob===id)return;watchedJob=id;let failures=0;async function poll(){if(watchedJob!==id)return;try{const job=await api(`/api/render/${id}/status`);failures=0;
      if($('#job-bar'))$('#job-bar').style.width=(job.progress*100)+'%';
      if($('#job-label'))$('#job-label').textContent=job.message;
      updateRenderIndicator(1);
      if(route==='videos'){
        const activeCard = document.querySelector('.active-render-card');
        if(activeCard){
          const pct = Math.round((job.progress || 0.1)*100);
          const ringVal = activeCard.querySelector('.appstore-ring-val');
          if(ringVal) ringVal.textContent = pct + '%';
          const fill = activeCard.querySelector('.job-progress-fill');
          if(fill) fill.style.width = pct + '%';
          const stage = activeCard.querySelector('.appstore-stage-text');
          if(stage && job.message) stage.textContent = job.message;
        }
      }
if(job.status==='done'||job.status==='error'){watchedJob=null;jobId=null;localStorage.removeItem('tv-studio-job');const button=document.querySelector('[data-action="render"]');if(button)button.innerHTML=icon('video')+'Dựng video';if(job.status==='done'){const result=job.result;dialog('Video đã dựng xong',`<video src="${esc(result.video_url)}" controls></video><p class="note">${result.duration} giây · Phụ đề: ${result.caption_timing==='word_boundary'?'theo thời điểm từ của giọng đọc':'thời gian ước tính'}</p><a href="${esc(result.video_url)}" download><button class="white">${icon('down')}Tải video MP4</button></a>${result.poster_url?`<a href="${esc(result.poster_url)}" download><button>${icon('image')}Tải ảnh bìa</button></a>`:''}`);}else dialog('Dựng video chưa thành công',`<p class="note">${esc(job.error||job.message)}</p><button data-action="retry-job" data-job-id="${esc(id)}">Thử lại cấu hình đã lưu</button>`);return;}}catch(e){failures++;if(e.message.includes('Không tìm thấy job')){watchedJob=null;jobId=null;localStorage.removeItem('tv-studio-job');toast('Server đã khởi động lại; tác vụ cũ không còn trong bộ nhớ. Bạn có thể dựng lại.');return;}if($('#job-label'))$('#job-label').textContent='Đang kết nối lại với server…';if(failures===5)toast('Chưa kết nối được server. Tiến trình sẽ tự kiểm tra lại.');}jobTimer=setTimeout(poll,2000);}await poll();}
function projectDialog(){dialog('Dự án & bản sao lưu',`<p class="note">Tự lưu tại trình duyệt. Xuất JSON để giữ nội dung, bố cục, giọng đọc và lựa chọn tài nguyên. File không chứa media; cần cùng thư viện local khi nhập lại.</p><div class="chips"><button data-action="export-project">${icon('down')}Xuất dự án JSON</button><button data-action="import-project">${icon('folder')}Nhập dự án JSON</button></div><input id="project-file" type="file" accept=".json,application/json" hidden>`);}
async function exportProject(){const data=await api('/api/studio/project/validate',{version:1,...S});const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='threadviral-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản sao dự án.');}
async function analyzeScenes(button){if(!S.scenes.length)throw Error('Thêm bài viết và bình luận trước.');button.disabled=true;try{const result=await api('/api/analyze',{scenes:S.scenes,max_comments:10,min_score:.18});const keep=new Set(result.selected.map(s=>s.text));snapshot();S.scenes=S.scenes.map((s,i)=>({...s,selected:i===0||keep.has(s.display_text)}));persist();sourceDialog();toast(`Đã chọn ${S.scenes.filter(s=>s.selected).length} cảnh bằng bộ chấm điểm nội bộ. Bạn có thể chỉnh lại từng cảnh.`);}finally{button.disabled=false;}}
async function suggestScript(button){if(!S.scenes.length)throw Error('Thêm nội dung trước.');button.disabled=true;try{const result=await api('/api/script',{scenes:S.scenes.filter(s=>s.selected!==false)});dialog('Gợi ý kịch bản',`<p class="note">Nguồn: ${esc(result.source)} · Kiểm tra nội dung trước khi dùng.</p><label>Mở đầu</label><textarea id="script-hook" maxlength="500">${esc(result.hook_text||'')}</textarea><label>Lời kết</label><textarea id="script-outro" maxlength="500">${esc(result.cta_text||'')}</textarea><p class="note">${esc(result.summary||'')}</p><button data-action="use-script">Dùng lời mở đầu & lời kết</button>`);}finally{button.disabled=false;}}

document.addEventListener('click',async e=>{const target=e.target.closest('button,[data-select],[data-section]');if(!target)return;try{if(target.dataset.section){section=target.dataset.section;previewCursor=0;selected='card';render();return;}if(target.dataset.select){selected=target.dataset.select;render();return;}if(target.dataset.panel){openPanel(target.dataset.panel);return;}if(target.dataset.mode){snapshot();S.style.background_mode=target.dataset.mode;persist();renderPanel();return;}if(target.dataset.bgType){snapshot();S.style.background_mode=target.dataset.bgType;persist();renderPanel();return;}if(target.dataset.subtitlePreset){snapshot();Object.assign(S.style,presetSelection(target.dataset.subtitlePreset));persist();render();return;}if(target.dataset.voiceTab){voiceBrowser.tab=target.dataset.voiceTab;renderPanel();return;}if(target.dataset.voiceCat){voiceBrowser.category=target.dataset.voiceCat;renderPanel();return;}if(target.dataset.subtitleTab){subtitleSettings.tab=target.dataset.subtitleTab;renderPanel();return;}switch(target.dataset.action){case 'open-voice-panel':
      openPanel('voice');
      break;
    case 'fetch-source': {
      const url = $('#source-url')?.value;
      if (!url) { toast('Vui lòng nhập link bài viết Threads.'); break; }
      target.disabled = true;
      target.innerHTML = icon('search') + ' Đang đọc...';
      try {
        const j = await api('/api/scrape', { url, max_comments: 15 });
        snapshot();
        S.scenes = j.scenes.map(s => ({ ...s, selected: true }));
        S.source_url = url;
        persist();
        refreshScenes();
        toast('Đã lấy bài viết và phân cảnh thành công!');
      } catch (err) {
        toast('Lỗi đọc bài: ' + err.message);
      } finally {
        target.disabled = false;
        target.innerHTML = icon('search') + ' Lấy bài viết';
      }
      break;
    }
    case 'create-page':
      closePanel();
      MediaPreview.stop();
      route = 'create';
      render();
      break;
    case 'delete-video': {
      const btn = target.closest('[data-action="delete-video"]');
      const filename = btn?.dataset?.filename || target.dataset.filename;
      if (!filename) {
        toast('Không tìm thấy tên video cần xóa.', 'error');
        break;
      }

      const card = btn ? btn.closest('.asset') : null;
      if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0.35';
        card.style.transform = 'scale(0.96)';
        card.style.pointerEvents = 'none';
      }
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="appstore-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;"></span>`;
      }

      try {
        const res = await api('/api/storage/' + encodeURIComponent(filename), null, { method: 'DELETE' });
        toast(res.message || ('Đã xóa thành công video: ' + filename));
        await loadVideos();
      } catch (err) {
        if (card) {
          card.style.opacity = '1';
          card.style.transform = '';
          card.style.pointerEvents = '';
        }
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = icon('trash');
        }
        toast('Lỗi khi xóa video: ' + (err.message || 'Không thể xóa'), 'error');
      }
      break;
    }

    case 'preview-media': {
      const kind = target.dataset.previewKind || 'audio';
      const src = target.dataset.src;
      if (kind === 'video') {
        MediaPreview.toggleVideo(src, target);
      } else if (kind === 'font') {
        MediaPreview.toggleFont(target.dataset.font || src, target);
      } else {
        MediaPreview.toggleAudio(src, target);
      }
      break;
    }
    case 'apply-voice-item': {
      snapshot();
      S.voice = target.dataset.voiceId;
      persist();
      toast('Đã chọn giọng đọc: ' + target.dataset.voiceName);
      break;
    }
    case 'apply-font': {
      snapshot();
      S.style.subtitle_font = target.dataset.font;
      persist();
      toast('Đã chọn font phụ đề: ' + target.dataset.font);
      break;
    }
    case'close-panel':closePanel();break;case'close-dialog':$('#dialog').close();break;case'menu':$('.sidebar').classList.toggle('open');break;case'setup':route='setup';render();break;case'jobs':closePanel();route='jobs';render();break;case'watch-job':jobId=target.dataset.jobId;localStorage.setItem('tv-studio-job',jobId);showJob();watchJob(jobId);break;case'retry-job':target.disabled=true;try{const result=await api('/api/render/'+encodeURIComponent(target.dataset.jobId)+'/retry',{});jobId=result.job_id;localStorage.setItem('tv-studio-job',jobId);showJob();watchJob(jobId);}finally{target.disabled=false;}break;case'videos':closePanel();route='videos';render();break;case'resource-page':closePanel();route='resources';render();break;case'filter-resource-tab':resourceTab=target.dataset.kind;resourcePageNum=0;render();break;case'res-prev':resourcePageNum=Math.max(0,resourcePageNum-1);render();break;case'res-next':resourcePageNum++;render();break;case'apply-bg-video':{snapshot();const file=target.dataset.src.split('/').pop();S.bg=file;S.style.background_mode='video';persist();toast('Đã chọn video nền: '+file);break;}case'apply-bgm':{snapshot();const file=target.dataset.src.split('/').pop();S.bgm=file;persist();toast('Đã chọn nhạc nền: '+file);break;}case'apply-sfx':{snapshot();S.style.sfx_source='/' + target.dataset.src.replace(/^\/+/, '');persist();toast('Đã gán SFX chuyển cảnh.');break;}case'apply-sticker':{addLayer('image','/' + target.dataset.src.replace(/^\/+/, ''));toast('Đã thêm nhãn dán vào cảnh.');break;}case'clean-storage':{target.disabled=true;try{const res=await api('/api/storage/clean',{keep_recent:5});toast('Đã xóa '+res.deleted_videos+' video cũ, giải phóng '+res.freed_mb+' MB.');loadVideos();}finally{target.disabled=false;}break;}case'normalize-scenes':{if(!S.scenes.length)throw Error('Chưa có cảnh nào để chuẩn hóa.');target.disabled=true;try{for(const sc of S.scenes){if(sc.display_text){const res=await api('/api/normalize',{text:sc.display_text});sc.tts_text=res.normalized||res.tts_text||sc.display_text;}}persist();sourceDialog();toast('Đã chuẩn hóa TTS cho tất cả cảnh.');}finally{target.disabled=false;}break;}case'discover-hot':openDiscoverDialog();break;case'do-discover':{const kw=$('#discover-kw')?$('#discover-kw').value:'';const box=$('#discover-results');if(box)box.innerHTML=`
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 20px;gap:14px;">
    <div class="appstore-spinner" style="position:relative;width:36px;height:36px;border-width:3px;border-top-color:#10b981;"></div>
    <div style="font-weight:700;color:#f8fafc;font-size:13px;">Đang quét bài viết Threads qua Playwright...</div>
    <div style="color:#64748b;font-size:11px;">Hệ thống đang tự động trích xuất các bài viết thịnh hành</div>
  </div>`;target.disabled=true;try{const res=await api('/api/discover-posts',{keyword:kw,max_posts:8});if(!box)return;if(!res.posts||!res.posts.length){box.innerHTML='<p class="note">Không tìm thấy bài viết nào phù hợp.</p>';return;}box.innerHTML=`<div style="display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding-right:4px;">${res.posts.map(p=>`<div style="background:#17171a;border:1px solid #27272a;border-radius:8px;padding:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong style="color:#60a5fa;">@${esc(p.author)}</strong><small style="color:#a1a1aa;">${esc(p.likes)} likes · ${esc(p.comments)} bình luận</small></div><p style="font-size:12px;line-height:1.4;margin:4px 0 10px;color:#e4e4e7;">${esc(p.preview)}</p><button class="white" data-action="pick-discovered" data-url="${esc(p.url)}" style="font-size:11px;padding:6px 10px;">${icon('check')} Chọn bài này</button></div>`).join('')}</div>`;}catch(err){if(box)box.innerHTML=`<p class="note" style="color:#f87171;">Lỗi: ${esc(err.message)}</p>`;}finally{target.disabled=false;}break;}case'pick-discovered':{const url=target.dataset.url;target.disabled=true;target.textContent='Đang đọc bài…';try{const j=await api('/api/scrape',{url,max_comments:15});snapshot();S.scenes=j.scenes.map(s=>({...s,selected:true}));$('#dialog').close();persist();refreshScenes();toast('Đã chọn bài viết thành công!');}finally{target.disabled=false;}break;}case'brand':openPanel('brand');break;case'source':route='create';closePanel();render();break;case'help':dialog('Studio local',`<p class="note">Dữ liệu → Chọn cảnh → Cấu hình → Dựng video. Màn này là bản dựng lại từ giao diện tham chiếu, không phải mã nguồn riêng của ThreadViral.<br><br>Đã nối: nền động tạo bằng code, thẻ HTML, chữ, hình, sticker, karaoke ước tính và pipeline repo. Có bìa, mở đầu, chuyển cảnh, SFX chọn thủ công và chuyển động từng lớp khi xuất MP4. Gợi ý kịch bản đang dùng bộ quy tắc của repo nếu chưa cấu hình dịch vụ AI.<br><br>Nhạc và video trong kho crawl là preview. Backend Edge-TTS có thể bị dịch vụ giới hạn.</p>`);break;case'play':playing=!playing;if(playing)previewStarted=performance.now()-previewCursor*1000;render();break;case'zoom-in':zoom=Math.min(1.5,zoom+.1);render();break;case'zoom-out':zoom=Math.max(.5,zoom-.1);render();break;case'fit':zoom=1;fit();break;case'undo':if(undo.length){redo.push(JSON.stringify(S));S=JSON.parse(undo.pop());persist();render();}break;case'redo':if(redo.length){undo.push(JSON.stringify(S));S=JSON.parse(redo.pop());persist();render();}break;case'tool-text':case'add-text':addLayer('text');break;case'tool-shape':addLayer('shape');break;case'tool-image':choose('background_image','layer');break;case'tool-spark':case'pick-sticker':choose('sticker','layer');break;case'tool-video':choose('background_video','layer');break;case'pick-background':choose(S.style.background_mode==='video'?'background_video':'background_image','background');break;case'pick-music':choose('background_music','music');break;case'pick-sfx':choose('sound_effect','sfx');break;case'asset-prev':assetPage--;renderPanel();break;case'asset-next':assetPage++;renderPanel();break;case'use-asset':{const a=resources.find(a=>a.local===target.dataset.local);if(!a)return;if(insertContext==='layer'){closePanel();if(a.kind==='background_video'){const cat=a.metadata.category||a.metadata.id,index=a.metadata.index||1;addLayer('video','/backgrounds/reference_'+cat+(index>1?'_'+String(index).padStart(2,'0'):'')+'.mp4');}else addLayer('image','/'+a.local);}else if(insertContext==='music'){snapshot();S.bgm=a.metadata.path.split('/').pop();persist();openPanel('music');}else if(insertContext==='sfx'){snapshot();S.style.sfx_source='/'+a.local;persist();openPanel('sticker');}else{snapshot();if(a.kind==='background_image'){S.style.background_mode='image';S.style.background_image='/'+a.local;}else{S.style.background_mode='video';const cat=a.metadata.category||a.metadata.id,index=a.metadata.index||1;S.bg='reference_'+cat+(index>1?'_'+String(index).padStart(2,'0'):'')+'.mp4';}persist();openPanel('background');}break;}case'sfx-off':snapshot();S.style.sfx_source='';persist();renderPanel();break;case'music-off':snapshot();S.bgm=null;persist();renderPanel();break;case'delete-layer':snapshot();S.style.layers=S.style.layers.filter(l=>l.id!==target.dataset.id);selected='card';persist();render();break;case'duplicate':{const l=S.style.layers.find(l=>l.id===selected);if(!l){toast('Chọn lớp chữ, hình hoặc ảnh để sao chép.');return;}if(S.style.layers.length>=17)throw Error('Đã đủ 20 lớp.');snapshot();const copy={...l,id:crypto.randomUUID(),name:l.name+' (bản sao)',y:Math.min(90,l.y+3)};S.style.layers.push(copy);selected=copy.id;persist();render();break;}case'copy-hook':{const from=section==='body'?'hook':'body';snapshot();const copies=S.style.layers.filter(l=>l.section===from).map(l=>({...l,id:crypto.randomUUID(),section}));S.style.layers.push(...copies.slice(0,17-S.style.layers.length));persist();render();break;}case'add-logo':addLayer('text');const logo=S.style.layers.find(l=>l.id===selected);logo.name='Logo bộ nhận diện';logo.text=S.watermark||'Tên kênh';logo.width=60;logo.height=6;persist();render();break;case'sample':snapshot();S.scenes=[{...sample,selected:true},{author:'minh.anh',display_text:'Có một buổi chiều bình yên cũng là một món quà rồi.',tts_text:'Có một buổi chiều bình yên cũng là một món quà rồi.',likes:'128',comments:'3',selected:true}];persist();refreshScenes();break;case'add-scene':snapshot();S.scenes.push({author:'tacgia',display_text:'',tts_text:'',selected:true});persist();refreshScenes();break;case'scene-delete':snapshot();S.scenes.splice(Number(target.dataset.index),1);persist();refreshScenes();break;case'scene-up':{let i=Number(target.dataset.index);if(i>0){snapshot();[S.scenes[i-1],S.scenes[i]]=[S.scenes[i],S.scenes[i-1]];persist();refreshScenes();}break;}case'save-scenes':if(S.scenes.some(s=>s.selected!==false&&!s.display_text.trim()))throw Error('Cảnh được chọn không được để trống.');$('#dialog').close();persist();render();break;case'scrape':{const url=$('#source-url').value;target.disabled=true;target.textContent='Đang đọc…';try{const j=await api('/api/scrape',{url,max_comments:15});snapshot();S.scenes=j.scenes.map(s=>({...s,selected:true}));persist();refreshScenes();toast('Đã lấy bài và bình luận. Hãy kiểm tra trước khi dựng.');}finally{target.disabled=false;}break;}case'reference-voice-play':playReferenceVoice(target.dataset.referenceId);break;case'preview-voice':{target.disabled=true;try{const result=await api('/api/studio/voice-preview',{text:(activeScene().tts_text||activeScene().display_text||sample.tts_text).slice(0,300),voice:S.voice,speed:S.speed});const player=$('#voice-preview-player');if(player)player.innerHTML=`<audio src="${esc(result.audio_url)}" controls autoplay style="width:100%;margin-top:12px"></audio>`;}finally{target.disabled=false;}break;}case'preview-scene':previewSceneIndex=Number(target.dataset.index);previewCursor=0;section='body';$('#dialog').close();render();break;case'generate-plan':await generatePlan(target);break;case'ai-plan':await openAIPlan(target);break;case'copy-ai-prompt':try{await navigator.clipboard.writeText(automation.prompt);toast('Đã sao chép prompt.');}catch{$('#ai-prompt').focus();$('#ai-prompt').select();toast('Chọn prompt rồi nhấn Ctrl+C.');}break;case'validate-ai-plan':await importAIPlan(target);break;case'apply-plan':{target.disabled=true;try{const result=await api('/api/studio/automation/apply',{scenes:S.scenes,plan:automation.draft});snapshot();S.scenes=result.scenes;persist();$('#dialog').close();render();toast('Đã áp dụng minh họa theo cảnh.');}finally{target.disabled=false;}break;}case'clear-scene-media':snapshot();S.scenes=S.scenes.map(s=>({...s,studio_media:null}));persist();render();break;case'project':projectDialog();break;case'export-project':await exportProject();break;case'import-project':$('#project-file').click();break;case'analyze-scenes':await analyzeScenes(target);break;case'script-scenes':await suggestScript(target);break;case'use-script':snapshot();S.style.hook_text=$('#script-hook').value;S.style.outro_text=$('#script-outro').value;persist();$('#dialog').close();openPanel('frame');break;case'render':await renderVideo();break;}}catch(error){toast(error.message);}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.scene){snapshot();if(el.dataset.key==='media_enabled'){if(S.scenes[Number(el.dataset.scene)].studio_media)S.scenes[Number(el.dataset.scene)].studio_media.enabled=el.checked;}else S.scenes[Number(el.dataset.scene)][el.dataset.key]=el.type==='checkbox'?el.checked:el.value;persist();return;}if(el.dataset.setting){snapshot();S[el.dataset.setting]=el.type==='checkbox'?el.checked:el.value;persist();return;}if(el.dataset.style){snapshot();const k=el.dataset.style,value=el.type==='checkbox'?el.checked:['range','number'].includes(el.type)||['subtitle_words','subtitle_outline','subtitle_shadow'].includes(k)?Number(el.value):el.value;if(k==='volume')S.volume=value;else S.style[k]=value;persist();render();return;}if(el.dataset.layerProp){const l=S.style.layers.find(l=>l.id===selected);if(l){snapshot();const key=el.dataset.layerProp;const value=key==='end_seconds'&&el.value===''?null:['range','number'].includes(el.type)?Number(el.value):el.value;if((key==='end_seconds'&&value!==null&&value<=(l.start_seconds||0))||(key==='start_seconds'&&l.end_seconds!==null&&l.end_seconds!==undefined&&value>=l.end_seconds)){toast('Kết thúc phải lớn hơn bắt đầu.');render();return;}l[key]=value;persist();render();}}});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.scene!==undefined){if(el.dataset.key==='media_enabled'){if(S.scenes[Number(el.dataset.scene)].studio_media)S.scenes[Number(el.dataset.scene)].studio_media.enabled=el.checked;}else S.scenes[Number(el.dataset.scene)][el.dataset.key]=el.type==='checkbox'?el.checked:el.value;persist();}if(el.dataset.setting&&(el.type==='text'||el.tagName==='TEXTAREA')){S[el.dataset.setting]=el.value;persist();}if(el.dataset.style&&(el.type==='text'||el.tagName==='TEXTAREA')){S.style[el.dataset.style]=el.value;persist();}if(el.dataset.layerProp&&(el.tagName==='TEXTAREA'||el.type==='number'))updateLayerInput(el);
if(e.target.id==='res-search-input'){
  resourceSearch=e.target.value;
  resourcePageNum=0;
  const cursor=e.target.selectionStart;
  render();
  const inp=$('#res-search-input');
  if(inp){inp.focus();inp.setSelectionRange(cursor,cursor);}
}
if(e.target.id==='voice-reference-search'){voiceBrowser.search=e.target.value;const cursor=e.target.selectionStart;renderPanel();$('#voice-reference-search').focus();$('#voice-reference-search').setSelectionRange(cursor,cursor);}if(e.target.id==='preview-seek'){previewCursor=Number(e.target.value);previewStarted=performance.now()-previewCursor*1000;}if(e.target.id==='asset-search'){assetQuery=e.target.value;assetPage=0;const cursor=e.target.selectionStart;renderPanel();$('#asset-search').focus();$('#asset-search').setSelectionRange(cursor,cursor);}});
let drag=null;document.addEventListener('pointerdown',e=>{const node=e.target.closest('.layer-node');if(!node||panel)return;selected=node.dataset.layer;const d=$('.design').getBoundingClientRect();snapshot();drag={id:selected,startX:e.clientX,startY:e.clientY,rect:d,node,initial:selected==='card'?S.style.card_y:selected==='subtitle'?S.style.subtitle_y:S.style.layers.find(l=>l.id===selected)?.y,x:S.style.layers.find(l=>l.id===selected)?.x};node.setPointerCapture(e.pointerId);});
document.addEventListener('pointermove',e=>{if(!drag)return;const dy=(e.clientY-drag.startY)/drag.rect.height*100,dx=(e.clientX-drag.startX)/drag.rect.width*100;const y=Math.max(0,Math.min(drag.id==='card'?80:94,drag.initial+dy));if(drag.id==='card')S.style.card_y=y;else if(drag.id==='subtitle')S.style.subtitle_y=Math.max(10,y);else{const l=S.style.layers.find(l=>l.id===drag.id);l.y=y;l.x=Math.max(0,Math.min(95,drag.x+dx));drag.node.style.left=l.x+'%';}drag.node.style.top=(y)+'%';});
document.addEventListener('pointerup',()=>{if(drag){drag=null;persist();render();}});
let draggedId=null;document.addEventListener('dragstart',e=>{if(e.target.dataset.dragLayer)draggedId=e.target.dataset.dragLayer;});document.addEventListener('dragover',e=>{if(e.target.closest('[data-drag-layer]'))e.preventDefault();});document.addEventListener('drop',e=>{const target=e.target.closest('[data-drag-layer]');if(!target||!draggedId)return;e.preventDefault();snapshot();const list=S.style.layers,from=list.findIndex(l=>l.id===draggedId),to=list.findIndex(l=>l.id===target.dataset.dragLayer);if(from>=0&&to>=0){const [l]=list.splice(from,1);list.splice(to,0,l);persist();render();}});
window.addEventListener('resize',fit);render();try{const r=await api('/api/studio/resources');resources=r.assets.filter(a=>a.status==='downloaded');const resourceButton=document.querySelector('[data-action="resource-page"]');if(resourceButton)resourceButton.innerHTML=icon('folder')+'Kho tài nguyên · '+resources.length.toLocaleString('vi-VN')+' tệp';}catch(e){toast(e.message);} 

document.addEventListener('change',async e=>{if(e.target.id!=='project-file')return;try{const file=e.target.files[0];if(!file)return;if(file.size>2_000_000)throw Error('File dự án tối đa 2 MB.');const data=await api('/api/studio/project/validate',JSON.parse(await file.text()));snapshot();S={...data,style:{...defaultStyle,...data.style}};S.style.subtitle_preset=presetAliases[S.style.subtitle_preset]||S.style.subtitle_preset;persist();$('#dialog').close();section='body';render();toast('Đã nhập dự án.');}catch(error){toast(error.message);}});
if(jobId)watchJob(jobId);

async function generatePlan(button){if(!S.scenes.length)throw Error('Thêm nội dung trước.');button.disabled=true;try{const result=await api('/api/studio/automation/suggest',{scenes:S.scenes,broll:automation.broll,sticker:automation.sticker,sfx:automation.sfx});automation.draft=result.plan;automation.prompt=result.prompt;closePanel();dialog('Gợi ý tài nguyên theo cảnh',planDialog(automation.draft,resources));}finally{button.disabled=false;}}
async function openAIPlan(button){if(!S.scenes.length)throw Error('Thêm nội dung trước.');button.disabled=true;try{const result=await api('/api/studio/automation/suggest',{scenes:S.scenes,broll:automation.broll,sticker:automation.sticker,sfx:automation.sfx});automation.prompt=result.prompt;closePanel();dialog('Gemini / ChatGPT · Kế hoạch minh họa',aiPlanDialog());}finally{button.disabled=false;}}
async function importAIPlan(button){button.disabled=true;try{const raw=$('#ai-result').value.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');const plan=JSON.parse(raw);plan.source='ai_import';await api('/api/studio/automation/apply',{scenes:S.scenes,plan});automation.draft=plan;dialog('Kiểm tra đề xuất AI',planDialog(plan,resources));}finally{button.disabled=false;}}
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.voiceFilter){voiceBrowser[el.dataset.voiceFilter]=el.value;renderPanel();}if(el.dataset.automationOption)automation[el.dataset.automationOption]=el.checked;if(el.dataset.planScene!==undefined){const row=automation.draft?.items.find(row=>row.scene_index===Number(el.dataset.planScene));if(row)row[el.dataset.planKey]=el.value;}});

let jobsTimer=null;
async function loadJobs(){
  clearTimeout(jobsTimer);
  try{
    const result = await api('/api/jobs');
    if (route !== 'jobs') return;
    const box = $('#jobs-dashboard');
    if (!box) return;

    const jobs = result.jobs || [];
    const doneCount = jobs.filter(j => j.status === 'done').length;
    const runningCount = jobs.filter(j => ['running', 'queued'].includes(j.status)).length;
    const errorCount = jobs.filter(j => j.status === 'error').length;

    box.innerHTML = `
      <div class="jobs-stats-row">
        <div class="job-stat-card">
          <div>
            <div class="val">${jobs.length}</div>
            <div class="lbl">Tổng số tác vụ</div>
          </div>
          <div style="color:#38bdf8;">${icon('grid')}</div>
        </div>
        <div class="job-stat-card">
          <div>
            <div class="val" style="color:#34d399;">${doneCount}</div>
            <div class="lbl">Hoàn tất thành công</div>
          </div>
          <div style="color:#10b981;">${icon('check')}</div>
        </div>
        <div class="job-stat-card">
          <div>
            <div class="val" style="color:#f87171;">${runningCount + errorCount}</div>
            <div class="lbl">Đang chạy / Cần thử lại</div>
          </div>
          <div style="color:#fbbf24;">${icon('spark')}</div>
        </div>
      </div>

      <div class="jobs-list" style="margin-top:14px;">
        ${jobs.map(job => {
          const isDone = job.status === 'done';
          const isRunning = ['running', 'queued'].includes(job.status);
          const isError = job.status === 'error';
          const badgeClass = isDone ? 'done' : isRunning ? 'running' : 'error';
          const badgeText = isDone ? '✓ Hoàn tất' : isRunning ? '⟳ Đang kết xuất...' : '✕ Gián đoạn / Thất bại';
          const timeStr = new Date(job.created_at * 1000).toLocaleString('vi-VN');
          const videoUrl = job.result?.video_url;

          return `
            <article class="job-card">
              <div class="job-top-bar">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span class="job-badge ${badgeClass}">${badgeText}</span>
                  <span style="font-weight:700;font-size:13px;color:#f8fafc;">${job.job_id || 'Tác vụ'}</span>
                </div>
                <small style="color:#64748b;font-weight:600;">${timeStr}</small>
              </div>

              <div style="font-size:12px;color:#cbd5e1;line-height:1.4;">
                ${esc(job.error || job.message || (isDone ? 'Video MP4 9:16 đã được render thành công và lưu vào thư mục outputs/' : 'Tác vụ đang được xử lý'))}
              </div>

              ${isRunning ? `
                <div class="job-progress-bar">
                  <div class="job-progress-fill" style="width:${Math.round((job.progress || 0.1) * 100)}%;"></div>
                </div>
              ` : isDone ? `
                <div class="job-progress-bar">
                  <div class="job-progress-fill" style="width:100%;background:#10b981;"></div>
                </div>
              ` : ''}

              <div class="job-actions-row">
                ${isRunning ? `
                  <button class="white" data-action="watch-job" data-job-id="${esc(job.job_id)}">
                    ${icon('eye')} Theo dõi tiến trình
                  </button>
                ` : ''}
                ${isError && job.retryable ? `
                  <button class="btn-emerald" data-action="retry-job" data-job-id="${esc(job.job_id)}">
                    ${icon('redo')} Thử lại cấu hình đã lưu
                  </button>
                ` : ''}
                ${isDone && videoUrl ? `
                  <a href="${esc(videoUrl)}" download>
                    <button class="btn-emerald">${icon('download')} Tải video MP4</button>
                  </a>
                ` : ''}
              </div>
            </article>
          `;
        }).join('') || '<div class="section-step-box" style="text-align:center;padding:40px;color:#64748b;">Chưa có tác vụ dựng nào trong hệ thống. Bấm "Tạo video mới" để bắt đầu.</div>'}
      </div>
    `;

    if (jobs.some(j => ['running', 'queued'].includes(j.status))) {
      jobsTimer = setTimeout(loadJobs, 2500);
    }
  }catch(e){
    toast('Lỗi nạp tác vụ: ' + e.message);
  }
}

function syncPreviewVideo(video,time,active=true){if(video.readyState<2||!Number.isFinite(video.duration)||video.duration<=0)return;const expected=Math.max(0,time)%video.duration;if(Math.abs(video.currentTime-expected)>(playing?.25:.02))video.currentTime=expected;const requested=String(playing&&active);if(video.dataset.playRequested!==requested){video.dataset.playRequested=requested;if(playing&&active)video.play().catch(()=>{});else video.pause();}}

function updateLayerInput(el){const layer=S.style.layers.find(l=>l.id===selected);if(!layer)return;const key=el.dataset.layerProp,value=key==='end_seconds'&&el.value===''?null:el.type==='number'?Number(el.value):el.value;if(typeof value==='number'&&(!Number.isFinite(value)||value<0||value>300))return;if((key==='end_seconds'&&value!==null&&value<=(layer.start_seconds||0))||(key==='start_seconds'&&layer.end_seconds!=null&&value>=layer.end_seconds))return;if(!el.dataset.editing){snapshot();el.dataset.editing='true';}layer[key]=value;persist();const node=Array.from(document.querySelectorAll('.layer-node')).find(n=>n.dataset.layer===layer.id);if(node){if(key==='start_seconds')node.dataset.start=String(value);if(key==='end_seconds')node.dataset.end=value===null?'':String(value);if(key==='text')node.textContent=value;if(key==='size')node.style.fontSize=value+'px';}}


document.addEventListener('input', e => {
  if (e.target.id === 'voice-reference-search') {
    voiceBrowser.search = e.target.value;
    renderPanel();
  }
});
