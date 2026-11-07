const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let catalogue = { synthesis: [], reference: [] };

// Asynchronous fetch without top-level await to ensure instant module load
fetch('/assets/library/voices/catalog.json?v=20261107.v3')
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (data && data.voices) catalogue.reference = data.voices;
  })
  .catch(() => {});

export const voiceBrowser = {
  tab: 'reference',
  category: 'all',
  search: '',
  gender: 'all',
  region: 'all'
};

const normalized = s => String(s).toLocaleLowerCase('vi').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

export function voicePanel(state, icon) {
  const tab = voiceBrowser.tab;
  return `
    <div class="voice-tabs" role="tablist" aria-label="Nguồn giọng đọc" style="display:flex;gap:8px;margin-bottom:12px;">
      <button role="tab" class="${tab === 'reference' ? 'white' : ''}" aria-selected="${tab === 'reference'}" data-voice-tab="reference" style="flex:1;">
        ${icon('sound')} Kho giọng đọc (${catalogue.reference.length || 35})
      </button>
      <button role="tab" class="${tab === 'generate' ? 'white' : ''}" aria-selected="${tab === 'generate'}" data-voice-tab="generate" style="flex:1;">
        ${icon('settings')} Cài đặt giọng dựng video
      </button>
    </div>
    ${tab === 'generate' ? generateSettings(state, icon) : referencePanel(state, icon)}
  `;
}

function generateSettings(state, icon) {
  return `
    <div style="background:#0d1220;border:1.5px solid #23304a;border-radius:10px;padding:14px;margin-bottom:12px;">
      <label style="font-weight:700;display:block;margin-bottom:6px;">Giọng đọc dựng video chính (Edge-TTS AI)</label>
      <select aria-label="Giọng đọc tiếng Việt" data-setting="voice" style="margin-bottom:10px;">
        <option value="vi-VN-HoaiMyNeural" ${state.voice === 'vi-VN-HoaiMyNeural' ? 'selected' : ''}>Hoài My (Nữ · Bắc · Tự nhiên, truyền cảm)</option>
        <option value="vi-VN-NamMinhNeural" ${state.voice === 'vi-VN-NamMinhNeural' ? 'selected' : ''}>Nam Minh (Nam · Bắc · Ấm áp, rõ ràng)</option>
      </select>
      <label style="font-weight:700;display:block;margin-bottom:6px;">Tốc độ đọc</label>
      <select aria-label="Nhịp đọc" data-setting="speed" style="margin-bottom:12px;">
        ${['-15%', '-10%', '+0%', '+10%', '+20%', '+30%'].map(v => `<option ${v === state.speed ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
      <button data-action="preview-voice" style="width:100%;" class="white">
        ${icon('sound')} Nghe thử giọng dựng hiện tại
      </button>
      <div id="voice-preview-player" style="margin-top:10px;"></div>
    </div>
    <label class="switch-row" style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;">
      Dựng video không lời đọc (im lặng)
      <input type="checkbox" data-setting="silent" ${state.silent ? 'checked' : ''}>
    </label>
    <p class="note" style="margin-top:8px;">Hệ thống tự động đồng bộ phụ đề chữ chạy ăn khớp theo từng phân cảnh giọng đọc AI.</p>
  `;
}

function referencePanel(state, icon) {
  const cat = voiceBrowser.category;
  const filtered = catalogue.reference.filter(v => {
    const textNorm = normalized(v.name + ' ' + (v.description || '') + ' ' + (v.group || ''));
    if (voiceBrowser.search && !textNorm.includes(normalized(voiceBrowser.search))) return false;
    if (cat === 'star' && !v.name.includes('⭐') && v.provider !== 'vieneu') return false;
    if (cat === 'featured' && v.provider !== 'vieneu') return false;
    if (cat === 'bac' && !textNorm.includes('bac')) return false;
    if (cat === 'nam_mien' && !textNorm.includes('nam') && !v.description?.toLowerCase().includes('nam · nam')) return false;
    if (cat === 'trung' && !textNorm.includes('trung')) return false;
    if (cat === 'female' && v.gender !== 'female') return false;
    if (cat === 'male' && v.gender !== 'male') return false;
    return true;
  });

  const categories = [
    ['all', 'Tất cả'],
    ['star', 'Giọng của bạn ⭐'],
    ['featured', 'Nổi bật'],
    ['bac', 'Miền Bắc'],
    ['trung', 'Miền Trung'],
    ['nam_mien', 'Miền Nam'],
    ['female', 'Giọng Nữ'],
    ['male', 'Giọng Nam']
  ];

  return `
    <div class="search-box" style="margin-bottom:10px;display:flex;align-items:center;gap:8px;background:#0e1424;border:1.5px solid #28354f;border-radius:8px;padding:4px 10px;">
      ${icon('search')}
      <input id="voice-reference-search" type="search" placeholder="Tìm tên giọng, phong cách, vùng miền..." value="${esc(voiceBrowser.search)}" style="border:none;background:transparent;padding:6px 0;">
    </div>

    <!-- Category Filter Chips matching user reference image -->
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;scrollbar-width:thin;">
      ${categories.map(([k, label]) => `
        <button class="voice-cat-btn ${cat === k ? 'white' : ''}" data-voice-cat="${k}" style="font-size:11px;padding:6px 12px;border-radius:20px;white-space:nowrap;flex-shrink:0;">
          ${label}
        </button>
      `).join('')}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <small style="color:#94a3b8;font-size:11px;">Hiển thị <strong>${filtered.length}</strong> giọng đọc chất lượng cao</small>
      <small style="color:#38bdf8;font-size:11px;">● Click Nghe thử để phát</small>
    </div>

    <!-- Grid of Voice Cards matching user reference image -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:12px;max-height:480px;overflow-y:auto;padding-right:4px;">
      ${filtered.map(v => {
        const isBacc = normalized(v.description || '').includes('bac') || normalized(v.name).includes('bac');
        const isTrung = normalized(v.description || '').includes('trung');
        const isNam = normalized(v.description || '').includes('nam · nam') || normalized(v.description || '').includes('mien nam');
        const regionTag = isTrung ? '<span class="tag-badge trung">Miền Trung</span>' : isNam ? '<span class="tag-badge nam">Miền Nam</span>' : '<span class="tag-badge bac">Miền Bắc</span>';
        const sampleUrl = v.sample_url || ('/assets/library/voices/' + (v.local ? v.local.split('/').pop() : v.id + '.mp3'));
        const sub = v.description || (v.gender === 'female' ? 'Nữ · Bắc · Tự nhiên' : 'Nam · Bắc · Tự nhiên');

        return `
          <article class="voice-card" style="background:#0e1424;border:1.5px solid #23304a;border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
            <div style="display:flex;align-items:flex-start;gap:10px;">
              <div style="width:36px;height:36px;border-radius:8px;background:#162035;border:1.5px solid #2b3b5c;display:flex;align-items:center;justify-content:center;color:#38bdf8;flex-shrink:0;">
                ${v.provider === 'vieneu' ? icon('spark') : icon('user')}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${esc(v.name)} <span style="color:#f59e0b;font-size:12px;">★</span>
                </div>
                <div style="font-size:10px;color:#94a3b8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(sub)}">
                  ${esc(sub)}
                </div>
              </div>
            </div>

            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <span class="tag-badge vi">Tiếng Việt</span>
              ${regionTag}
            </div>

            <div style="display:flex;gap:6px;margin-top:4px;">
              <button class="btn-preview-state" data-action="preview-media" data-preview-kind="audio" data-src="${esc(sampleUrl)}" style="flex:1;">
                <span class="preview-icon">▶</span> Nghe thử
              </button>
              <button class="btn-apply-action" data-action="apply-voice-item" data-voice-id="${esc(v.id)}" data-voice-name="${esc(v.name)}" title="Chọn giọng này">
                + Chọn
              </button>
            </div>
          </article>
        `;
      }).join('') || '<p class="note" style="grid-column:1/-1;text-align:center;padding:30px;">Không tìm thấy giọng đọc phù hợp với bộ lọc.</p>'}
    </div>
  `;
}

export function playReferenceVoice(id) {
  const voice = catalogue.reference.find(v => v.id === id);
  if (!voice) return;
  const sampleUrl = voice.sample_url || ('/assets/library/voices/' + (voice.local ? voice.local.split('/').pop() : voice.id + '.mp3'));
  const btn = document.querySelector(`[data-reference-id="${id}"]`) || document.querySelector(`[data-src="${sampleUrl}"]`);
  if (typeof window !== 'undefined' && window.MediaPreview) {
    window.MediaPreview.toggleAudio(sampleUrl, btn);
  } else {
    new Audio(sampleUrl).play().catch(() => {});
  }
}
