import { PRODUCTS } from './data.js';
import { escapeHtml as esc, filterProducts, buildWhatsAppURL, WHATSAPP_CONTACTS, CITIES } from './utils.js';

const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const CONTACTS = WHATSAPP_CONTACTS;
const INSTAGRAM = 'https://www.instagram.com/daratouch.kz/';
const BY_ID = new Map(PRODUCTS.map(p => [p.id, p]));
const state = {
  lang: readPreference('dara-lang') === 'kz' ? 'kz' : 'ru',
  city: readCity(),
  filters: {size: 'all', family: 'all', search: '', sort: 'popular'},
  selected: 'wad75',
  compare: new Set(),
  gallery: 'front',
  menu: false
};
let previousFocus = null;
let modalContext = null;
const L = (ru, kz) => state.lang === 'ru' ? ru : kz;
const value = obj => obj?.[state.lang] || obj?.ru || '';

function readPreference(key) { try { return localStorage.getItem(key); } catch { return null; } }
function savePreference(key, val) { try { localStorage.setItem(key, val); } catch {} }
function readCity() {
  const saved = readPreference('dara-city');
  return CITIES.some(c => c.id === saved) ? saved : CITIES[0].id;
}
function cityEntry(id = state.city) { return CITIES.find(c => c.id === id) || CITIES[0]; }
function setCity(id) {
  if (!CITIES.some(c => c.id === id)) return;
  state.city = id;
  savePreference('dara-city', id);
  document.querySelectorAll('[data-action="city"]').forEach(b => {
    const on = b.dataset.city === id;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  const deliveryLabel = modalRoot.querySelector('[data-delivery-city]');
  if (deliveryLabel) deliveryLabel.textContent = value(cityEntry().delivery);
  modalRoot.querySelectorAll('input[name="city"]').forEach(i => { i.checked = i.value === id; });
}
function icon(name, cls = '') {
  const paths = {
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    screen: '<rect x="2.5" y="3" width="19" height="14" rx="1.5"/><path d="M8 21h8M12 17v4"/>',
    pen: '<path d="m3 16 12-12 5 5L8 21l-6 1zM13 6l5 5M3 16l5 5"/>',
    people: '<circle cx="9" cy="6" r="3"/><circle cx="18" cy="7" r="2.5"/><path d="M2 20v-3a7 7 0 0 1 14 0v3M17 13a5 5 0 0 1 5 5v2"/>',
    folder: '<path d="M3 5h6l2 3h10v13H3z"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    touch: '<path d="M9 12V5a2 2 0 0 1 4 0v8l2-2 5 3v5a4 4 0 0 1-4 4h-4l-7-9a2 2 0 0 1 3-2l1 1"/><path d="M5 7a6 6 0 0 1 14 0"/>',
    usb: '<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 12h10"/>',
    settings: '<path d="m9 3 1-2h4l1 2 3 2 2 0 2 4-1 2v3l1 2-2 4-3 0-3 2-1 2h-4l-1-2-3-2-2 0-2-4 1-2v-3L2 9l2-4 2 0z"/><circle cx="12" cy="12" r="3"/>',
    android: '<path d="M5 8h14v10H5zM7 8a5 5 0 0 1 10 0M7 3 5 1M17 3l2-2M2 9v8M22 9v8M8 18v4M16 18v4"/><circle cx="9" cy="6" r=".6" fill="currentColor"/><circle cx="15" cy="6" r=".6" fill="currentColor"/>',
    truck: '<path d="M2 5h12v12H2zM14 9h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    pin: '<path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor"/>',
    wa: '<path d="M21 11.5A9 9 0 0 1 7.5 19.3L2 21l1.8-5.4A9 9 0 1 1 21 11.5Z"/><path d="M8 7c-1 0-1 2 0 4 1.5 3 4 5 6 5 1 0 2-1 2-2l-3-2-1 1-3-3 1-1-1-2z"/>'
  };
  return '<svg class="icon '+cls+'" viewBox="0 0 24 24" aria-hidden="true">'+(paths[name] || paths.screen)+'</svg>';
}
function instagramLink(cls='') {
  return '<a class="instagram-link '+cls+'" href="'+INSTAGRAM+'" target="_blank" rel="noopener noreferrer" aria-label="DARA Touch Instagram @daratouch.kz">'+icon('instagram')+'<span>@daratouch.kz</span></a>';
}
function phoneLinks(cls='', whatsapp=false) {
  return CONTACTS.map(c=>'<a class="'+cls+'" href="'+(whatsapp?'https://wa.me/'+c.digits:'tel:+'+c.digits)+'"'+(whatsapp?' target="_blank" rel="noopener noreferrer"':'')+'>'+ (whatsapp?icon('wa'):'')+c.phone+'</a>').join('');
}
function brand(white=false) {
  return '<a class="brand'+(white?' white':'')+'" href="#/home" aria-label="DARA Touch — '+L('главная','басты бет')+'">DARA <span>Touch</span></a>';
}
function button(label, attrs='', cls='') {
  return '<button type="button" class="btn '+cls+'" '+attrs+'>'+label+'</button>';
}
function consultation(label=L('Получить консультацию','Кеңес алу'), product='', cls='') {
  return button(label, 'data-action="consult"'+(product?' data-product="'+esc(product)+'"':''), cls);
}
function textLink(label, href) {
  return '<a class="text-link" href="'+href+'">'+label+icon('arrow')+'</a>';
}
function image(p, cls='', eager=false) {
  return '<img class="'+cls+'" src="'+p.image+'" alt="'+esc(value(p.imageAlt))+'" '+(eager?'fetchpriority="high"':'loading="lazy"')+' decoding="async" width="720" height="576">';
}
function route() {
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  const [path, query=''] = hash.split('?');
  const [page, id] = path.split('/');
  return {page:['home','catalog','education','specifications','product'].includes(page)?page:'home', id, params:new URLSearchParams(query)};
}
function cityBar() {
  return '<div class="city-bar"><div class="container city-bar-inner"><span class="city-bar-label">'+icon('pin')+L('Ваш город','Сіздің қалаңыз')+'</span>'+
    '<div class="city-switch" role="group" aria-label="'+L('Выбор города','Қала таңдау')+'">'+
    CITIES.map(c=>'<button type="button" data-action="city" data-city="'+c.id+'" aria-pressed="'+(state.city===c.id)+'" class="'+(state.city===c.id?'active':'')+'">'+esc(value(c))+'</button>').join('')+
    '</div></div></div>';
}
function header(page) {
  return '<header class="site-header"><div class="container header-inner">'+brand()+
    '<nav class="nav'+(state.menu?' open':'')+'" aria-label="'+L('Основная навигация','Негізгі навигация')+'">'+
    [['catalog',L('Каталог','Каталог')],['education',L('Для образования','Білім беру үшін')],['specifications',L('Характеристики','Сипаттамалар')]]
      .map(([id,title])=>'<a href="#/'+id+'"'+(page===id?' class="active" aria-current="page"':'')+'>'+title+'</a>').join('')+
    '</nav><div class="header-actions"><div class="lang-switch" aria-label="'+L('Язык','Тіл')+'">'+
    '<button type="button" data-action="lang" data-lang="ru" lang="ru" aria-pressed="'+(state.lang==='ru')+'" class="'+(state.lang==='ru'?'active':'')+'">RU</button><span aria-hidden="true">/</span>'+
    '<button type="button" data-action="lang" data-lang="kz" lang="kk" aria-pressed="'+(state.lang==='kz')+'" class="'+(state.lang==='kz'?'active':'')+'">KZ</button></div>'+
    instagramLink('header-instagram')+consultation(L('Аренда','Жалға алу'),'','btn-outline btn-sm')+
    '<button type="button" class="menu-toggle" data-action="menu" aria-expanded="'+state.menu+'" aria-label="'+L('Открыть меню','Мәзірді ашу')+'">'+icon(state.menu?'close':'menu')+'</button></div></div></header>';
}
function subbar(page, p) {
  if (page==='home' || page==='product') {
    return '<div class="subbar"><div class="container subbar-inner"><div class="subbar-title">Samsung '+p.model+' <small>'+p.size+'″ · '+p.os+'</small></div><div class="subbar-links">'+
      '<a href="#/specifications">'+L('Характеристики','Сипаттамалар')+'</a>'+consultation(L('Узнать стоимость аренды','Жалдау бағасын сұрау'),p.id,'btn-sm')+'</div></div></div>';
  }
  const title = page==='education'?L('SAMSUNG ДЛЯ ОБРАЗОВАНИЯ','БІЛІМ БЕРУГЕ АРНАЛҒАН SAMSUNG'):
    page==='specifications'?L('ХАРАКТЕРИСТИКИ ПАНЕЛЕЙ SAMSUNG','SAMSUNG ПАНЕЛЬДЕРІНІҢ СИПАТТАМАЛАРЫ'):L('АРЕНДА ПАНЕЛЕЙ SAMSUNG','SAMSUNG ПАНЕЛЬДЕРІН ЖАЛҒА БЕРУ');
  return '<div class="subbar"><div class="container subbar-inner"><span class="subbar-label">'+title+'</span><b class="subbar-label">65″ / 75″ / 86″</b></div></div>';
}
function breadcrumbs(title, detail=false) {
  return '<div class="breadcrumbs"><a href="#/home">'+L('Главная','Басты бет')+'</a><span>/</span>'+
    (detail?'<a href="#/catalog">'+L('Каталог','Каталог')+'</a><span>/</span>':'')+'<span>'+title+'</span></div>';
}
function footer() {
  return '<footer class="container"><div class="footer-inner"><div class="footer-brand">'+brand()+'<span class="footer-tag">'+L('Аренда панелей Samsung','Samsung панельдерін жалға беру')+'</span></div>'+
    '<nav class="footer-nav" aria-label="'+L('Дополнительная навигация','Қосымша навигация')+'"><a href="#/catalog">'+L('Каталог','Каталог')+'</a><a href="#/education">'+L('Для образования','Білім беру үшін')+'</a><button type="button" data-action="contacts" style="background:none;padding:0;color:inherit;font:inherit">'+L('Контакты','Байланыс')+'</button></nav></div>'+
    '<div class="footer-contacts">'+phoneLinks('footer-phone')+instagramLink()+'</div>'+
    '<div class="footer-note"><span>© '+new Date().getFullYear()+' DARA Touch · '+L('Сцены уроков приведены для иллюстрации применения.','Сабақ көріністері қолдану мысалы ретінде көрсетілген.')+'</span><span class="contact-text"><button type="button" data-action="privacy">'+L('Данные и конфиденциальность','Деректер және құпиялық')+'</button></span></div></footer>';
}
function cta(title=L('Samsung в аренду для ваших задач','Міндеттеріңізге сай Samsung жалға алыңыз'), subtitle=L('Укажите дату и срок аренды — обсудим модель и стоимость.','Жалдау күні мен мерзімін айтыңыз — модель мен бағасын талқылаймыз.')) {
  return '<section class="cta"><div><h2>'+title+'</h2><p>'+subtitle+'</p></div>'+consultation(L('Обсудить аренду','Жалдауды талқылау'),'','btn-white')+'</section>';
}
function sizeCards(education=false) {
  return '<div class="size-grid">'+[65,75,86].map(size=>'<a class="size-card" href="#/catalog?size='+size+'"><div class="display-outline" aria-hidden="true"></div><div>'+
    (size===75?'<span class="badge '+(education?'':'badge-solid')+'">'+L('4 серии','4 серия')+'</span>':'')+
    '<h3>'+size+'″</h3><p>'+(size===75? 'WAF · WAD · Flip 3 · Flip Pro':L('Интерактивная панель Samsung','Samsung интерактивті панелі'))+'</p><span class="text-link">'+L('Смотреть модели','Модельдерді көру')+icon('arrow')+'</span></div></a>').join('')+'</div>';
}
function renderGallery(p) {
  return '<div class="gallery" data-mode="'+state.gallery+'"><img class="gallery-main" src="'+(state.gallery==='classroom'?'assets/classroom.png':p.image)+'" alt="'+esc(state.gallery==='classroom'?L('Пример урока с интерактивной панелью Samsung','Samsung интерактивті панелімен сабақ мысалы'):value(p.imageAlt))+'" fetchpriority="high" width="720" height="576">'+
    '<div class="thumbs">'+[['front',p.image,L('Вид спереди','Алдыңғы көрініс')],['classroom','assets/classroom.png',L('В классе','Сыныпта')],['ports',p.image,L('Панель управления','Басқару панелі')]].map(([mode,path,label])=>'<button type="button" class="thumb '+(mode==='ports'?'crop ':'')+(state.gallery===mode?'active':'')+'" data-action="gallery" data-gallery="'+mode+'" aria-pressed="'+(state.gallery===mode)+'" aria-label="'+label+'"><img src="'+path+'" alt="" loading="lazy"></button>').join('')+'</div></div>';
}
function home() {
  const p=BY_ID.get('wad75');
  const features = [
    ['screen','75″ · 4K UHD',L('Большой и чёткий экран','Үлкен әрі анық экран')],
    ['android','Android 13',L('Привычный интерфейс','Таныс интерфейс')],
    ['touch',L('40 касаний','40 жанасу'),L('Работайте на экране вместе','Экранда бірге жұмыс істеңіз')],
    ['usb','USB-C · 65 '+L('Вт','Вт'),L('Экран, сенсор и зарядка','Бейне, сенсор және қуаттау')]
  ];
  return '<main id="main" class="container page-transition"><section class="home-hero">'+renderGallery(p)+'<div class="home-copy"><span class="badge">'+L('Samsung в аренду · WAD 75″','Samsung жалға беру · WAD 75″')+'</span>'+
    '<h1>'+L('Аренда интерактивной<br>панели Samsung 75″','Samsung 75″<br>интерактивті панелін жалға алу')+'</h1><div class="model-code">'+p.sku+'</div><div class="hero-os">Android 13 · 4K UHD</div>'+
    '<p class="hero-description">'+L('Большой экран в аренду для обучения, мероприятий, презентаций и совместной работы.','Оқытуға, іс-шараларға, таныстырылымдарға және бірлескен жұмысқа арналған үлкен экранды жалға алыңыз.')+'</p><p class="catalog-sizes">'+L('Для аренды: 65″, 75″ и 86″.','Жалға алу үшін: 65″, 75″ және 86″.')+'</p>'+
    '<div class="actions">'+consultation(L('Узнать стоимость аренды','Жалдау бағасын сұрау'),p.id)+textLink(L('Характеристики','Сипаттамалар'),'#/specifications')+'</div></div></section>'+
    '<div class="feature-strip" aria-label="'+L('Возможности Samsung WAD 75″','Samsung WAD 75″ мүмкіндіктері')+'">'+features.map(([ic,t,d])=>'<div class="feature">'+icon(ic)+'<div><b>'+t+'</b><p>'+d+'</p></div></div>').join('')+'</div>'+
    '<section class="section"><div class="section-title center"><h2>'+L('Объясняйте. Рисуйте. Вовлекайте.','Түсіндіріңіз. Сурет салыңыз. Қызықтырыңыз.')+'</h2><p>'+L('Наглядные уроки начинаются с одного экрана.','Көрнекі сабақ бір экраннан басталады.')+'</p></div>'+
    '<div class="classroom-section"><img src="assets/classroom.png" alt="'+L('Учитель объясняет геометрию с помощью панели Samsung','Мұғалім Samsung панелімен геометрияны түсіндіруде')+'" loading="lazy" width="1672" height="941"><div><h2>'+L('Больше участия<br>в каждом уроке','Әр сабаққа<br>көбірек қатысу')+'</h2><p>'+L('Пишите на экране, показывайте материалы и обсуждайте идеи вместе.','Экранға жазыңыз, материалдарды көрсетіңіз және идеяларды бірге талқылаңыз.')+'</p>'+textLink(L('Для образования','Білім беру үшін'),'#/education')+'</div></div></section>'+
    '<section class="section"><div class="section-title center"><h2>'+L('Samsung для любых задач','Әртүрлі міндеттерге арналған Samsung')+'</h2><p>'+L('Выберите диагональ для аренды: 65″, 75″ или 86″.','Жалға алу үшін диагональді таңдаңыз: 65″, 75″ немесе 86″.')+'</p></div>'+sizeCards()+'</section>'+cta()+'</main>';
}
function education() {
  const benefits=[['pen',L('Пишите на экране','Экранға жазыңыз')],['folder',L('Показывайте материалы','Материалдарды көрсетіңіз')],['people',L('Работайте вместе','Бірге жұмыс істеңіз')]];
  const subjects=[
    ['classroom',L('Математика','Математика'),L('Разбирайте задачи и чертежи.','Есептер мен сызбаларды талдаңыз.')],
    ['geography',L('География','География'),L('Изучайте карты и маршруты.','Карталар мен бағыттарды зерттеңіз.')],
    ['language',L('Языки','Тілдер'),L('Читайте и обсуждайте тексты.','Мәтіндерді оқып, талқылаңыз.')]
  ];
  return '<main id="main" class="container page-transition">'+breadcrumbs(L('Для образования','Білім беру үшін'))+
    '<section class="education-hero"><div><p class="eyebrow">'+L('Аренда для школ и учебных центров','Мектептер мен оқу орталықтарына жалға беру')+'</p><h1>'+L('Интерактивные панели Samsung для образования','Білім беруге арналған Samsung интерактивті панельдері')+'</h1><p class="lead">'+L('Объясняйте наглядно.<br>Вовлекайте в каждый урок.','Көрнекі түсіндіріңіз.<br>Әр сабаққа қызықтырыңыз.')+'</p>'+
    '<p class="description">'+L('Показывайте материалы, делайте заметки и разбирайте задания вместе с учениками.','Материалдарды көрсетіңіз, жазбалар жасаңыз және тапсырмаларды оқушылармен бірге талдаңыз.')+'</p><div class="actions">'+consultation(L('Подобрать панель в аренду','Жалға панель таңдау'))+textLink(L('Смотреть каталог','Каталогты көру'),'#/catalog')+'</div></div>'+
    '<img src="assets/classroom.png" alt="'+L('Наглядный урок геометрии с панелью Samsung','Samsung панелімен көрнекі геометрия сабағы')+'" fetchpriority="high" width="1672" height="941"></section>'+
    '<div class="education-strip">'+benefits.map(([ic,title])=>'<div>'+icon(ic)+'<span>'+title+'</span></div>').join('')+'</div>'+
    '<section class="section"><div class="section-title center"><h2>'+L('Панель в каждом предмете','Әр пәнге арналған панель')+'</h2><p>'+L('Наглядные примеры для разных уроков.','Әртүрлі сабақтарға арналған көрнекі мысалдар.')+'</p></div><div class="subject-grid">'+subjects.map(([file,title,desc])=>'<article class="subject-card"><img src="assets/'+file+'.png" alt="'+esc(title+': '+desc)+'" loading="lazy" width="1672" height="941"><h3>'+title+'</h3><p>'+desc+'</p></article>').join('')+'</div></section>'+
    '<section class="teacher-panel"><div><h2>'+L('Удобно для учителя','Мұғалімге ыңғайлы')+'</h2><p>'+L('Больше способов объяснить материал.','Материалды түсіндірудің көбірек тәсілі.')+'</p></div><ul class="teacher-list">'+[
      L('Пишите и делайте заметки','Жазыңыз және белгі қойыңыз'),L('Показывайте материалы с ноутбука','Ноутбуктен материалдар көрсетіңіз'),L('Разбирайте задания вместе','Тапсырмаларды бірге талдаңыз')
    ].map(t=>'<li>'+icon('check')+t+'</li>').join('')+'</ul></section>'+
    '<section class="section"><div class="section-title center"><h2>'+L('Панель для вашей аудитории','Аудиторияңызға арналған панель')+'</h2><p>'+L('Выберите диагональ и сравните серии Samsung.','Диагональді таңдап, Samsung серияларын салыстырыңыз.')+'</p></div>'+sizeCards(true)+'</section>'+
    cta(L('Samsung для вашего класса','Сыныбыңызға арналған Samsung'),L('Расскажите о вашей аудитории и сроке аренды — подберём панель.','Аудиторияңыз бен жалдау мерзімі туралы айтыңыз — лайықты панельді таңдаймыз.'))+'</main>';
}

function touchShort(p) {
  if(p.id==='flip3') return '4 / '+L('до 20*','20-ға дейін*');
  const n=(p.touch.ru.match(/\d+/)||[''])[0];
  return L('До '+n+' касаний',n+' жанасуға дейін');
}
function chargeShort(p) {
  return p.charge ? 'USB-C · '+L('зарядка до '+p.charge+' Вт',p.charge+' Вт-қа дейін қуаттау') : 'HDMI · DP · OPS';
}
function productCard(p) {
  return '<article class="product-card'+(p.bestselling?' bestseller':'')+'"><a class="product-photo" href="#/product/'+p.id+'" aria-label="'+esc(value(p.name))+'">'+
    (p.bestselling?'<span class="badge badge-solid">'+L('WAD 75″ · Android 13','WAD 75″ · Android 13')+'</span>':'')+image(p)+'</a>'+
    '<div class="product-info"><h3><a href="#/product/'+p.id+'">'+esc(value(p.name))+'</a></h3><p class="sku">'+p.sku+'</p><div class="product-tags"><span class="tag">'+p.size+'″</span><span class="tag">4K UHD</span><span class="tag">'+p.os+'</span></div>'+
    '<ul class="product-lines"><li>'+(p.id==='flip3'?L('Письмо: задержка 34 мс','Жазу кідірісі: 34 мс'):touchShort(p))+'</li><li>'+chargeShort(p)+'</li></ul>'+
    consultation(L('Узнать стоимость аренды','Жалдау бағасын сұрау'),p.id,'btn-full')+'<div class="product-detail-link">'+textLink(L('Подробнее','Толығырақ'),'#/product/'+p.id)+'</div>'+
    '<label class="compare-check"><input type="checkbox" data-compare="'+p.id+'" '+(state.compare.has(p.id)?'checked':'')+'>'+L('Сравнить','Салыстыру')+'</label></div></article>';
}
function chips(values, key, current, blue=false) {
  return '<div class="chips">'+values.map(([v,label])=>'<button type="button" class="chip '+(blue?'blue ':'')+(String(current)===String(v)?'active':'')+'" data-action="filter" data-filter="'+key+'" data-value="'+esc(v)+'" aria-pressed="'+(String(current)===String(v))+'">'+label+'</button>').join('')+'</div>';
}
function catalogProducts() {
  const list=filterProducts(PRODUCTS,state.filters);
  return list.length?list.map(productCard).join(''):'<div class="empty-state"><h3>'+L('Модели не найдены','Модельдер табылмады')+'</h3><p>'+L('Попробуйте изменить фильтры или поисковый запрос.','Сүзгілерді немесе іздеу сұрауын өзгертіңіз.')+'</p>'+button(L('Сбросить фильтры','Сүзгілерді тазарту'),'data-action="reset-filters"','btn-outline')+'</div>';
}
function catalogCount() {
  return L('Найдено моделей: ','Табылған модельдер: ')+filterProducts(PRODUCTS,state.filters).length;
}
function screenStack() {
  return '<div class="screen-stack" aria-hidden="true"><div class="stack-screen s86">86″</div><div class="stack-screen s75">75″</div><div class="stack-screen s65">65″</div></div>';
}
function catalog() {
  const f=state.filters;
  return '<main id="main" class="container page-transition">'+breadcrumbs(L('Каталог','Каталог'))+'<div class="page-heading"><h1>'+L('Каталог панелей для аренды','Жалға берілетін панельдер каталогы')+'</h1><p>'+L('Аренда Samsung 65″, 75″ и 86″. В диагонали 75″ — WAF, WAD, Flip 3 и Flip Pro.','Samsung 65″, 75″ және 86″ жалға беру. 75″ диагоналінде — WAF, WAD, Flip 3 және Flip Pro.')+'</p></div>'+
    '<div class="filter-panel"><div class="filter-row"><span class="filter-label">'+L('Диагональ','Диагональ')+'</span>'+chips([['all',L('Все','Барлығы')],[65,'65″'],[75,'75″'],[86,'86″']],'size',f.size)+
    '<label class="search-wrap">'+icon('search')+'<input type="search" id="catalog-search" aria-label="'+L('Поиск по модели','Модельді іздеу')+'" placeholder="'+L('Поиск по модели','Модельді іздеу')+'" value="'+esc(f.search)+'" autocomplete="off"></label></div>'+
    '<div class="filter-row"><span class="filter-label">'+L('Серия','Серия')+'</span>'+chips([['all',L('Все','Барлығы')],['WAF','WAF'],['WAD','WAD'],['Flip 3','Flip 3'],['Flip Pro','Flip Pro']],'family',f.family)+'</div></div>'+
    '<div class="catalog-toolbar"><span id="catalog-count" aria-live="polite">'+catalogCount()+'</span><select id="catalog-sort" aria-label="'+L('Сортировка','Сұрыптау')+'">'+[
      ['popular',L('По умолчанию','Әдепкі ретпен')],['sizeAsc',L('Диагональ: по возрастанию','Диагональ: өсу ретімен')],['sizeDesc',L('Диагональ: по убыванию','Диагональ: кему ретімен')]
    ].map(([v,t])=>'<option value="'+v+'" '+(f.sort===v?'selected':'')+'>'+t+'</option>').join('')+'</select></div>'+
    '<div class="product-grid" id="catalog-grid">'+catalogProducts()+'</div>'+
    '<section class="help-panel"><div><h2>'+L('Какую панель выбрать?','Қай панельді таңдау керек?')+'</h2><p>'+L('Поможем сравнить серии и подобрать диагональ под ваши задачи.','Серияларды салыстырып, міндеттеріңізге сай диагональді таңдауға көмектесеміз.')+'</p>'+consultation(L('Помочь с выбором','Таңдауға көмектесу'),'','btn-outline')+'</div>'+screenStack()+'</section>'+
    cta(L('Нужна панель для школы или офиса?','Мектепке немесе офиске панель қажет пе?'))+'</main>';
}
function selectedModel(p) {
  const specs=[
    ['screen',L('Диагональ','Диагональ'),p.size+'″'],
    ['screen',L('Разрешение','Ажыратымдылық'),'3840 × 2160'],
    ['settings',L('ОС','ОЖ'),p.os],
    ['touch',L('Мультитач','Мультитач'),touchShort(p)]
  ];
  return '<section class="selected-model"><div class="selected-photo">'+image(p,'',true)+'</div><div class="selected-info">'+
    (p.bestselling?'<span class="badge badge-solid">'+L('WAD 75″ · Android 13','WAD 75″ · Android 13')+'</span>':'<span class="badge">'+p.family+' · '+p.size+'″</span>')+
    '<h2>'+esc(value(p.name))+'</h2><div class="model-code">'+p.sku+'</div><div class="spec-tiles">'+specs.map(([ic,title,v])=>'<div class="spec-tile">'+icon(ic)+'<div><small>'+title+'</small><b>'+v+'</b></div></div>').join('')+'</div>'+
    '<p class="connection">'+icon('usb')+' '+(p.charge?L('USB-C: экран, сенсор и зарядка до 65 Вт','USB-C: бейне, сенсор және 65 Вт-қа дейін қуаттау'):p.ports)+'</p>'+
    consultation(L('Узнать стоимость аренды','Жалдау бағасын сұрау'),p.id,'btn-full')+textLink(L('Открыть в каталоге','Каталогта ашу'),'#/product/'+p.id)+'</div></section>';
}
function comparisonTable(list, current='', modal=false) {
  const rows=[
    [L('Диагональ','Диагональ'),p=>p.size+'″'],
    [L('Разрешение','Ажыратымдылық'),p=>'4K UHD'],
    [L('ОС','ОЖ'),p=>p.os],
    [L('Тип панели','Панель түрі'),p=>p.panelType],
    [L('Одновременный ввод','Бір уақыттағы енгізу'),p=>touchShort(p)],
    [L('Ключевые подключения','Негізгі қосылымдар'),p=>p.charge?'USB-C · '+L('до 65 Вт','65 Вт-қа дейін'):'HDMI · DP · OPS']
  ];
  return '<p class="table-hint">'+L('Прокрутите таблицу вправо, чтобы увидеть все модели.','Барлық модельді көру үшін кестені оңға сырғытыңыз.')+'</p><div class="table-scroll" tabindex="0" role="region" aria-label="'+L('Сравнительная таблица','Салыстыру кестесі')+'"><table class="comparison-table"><thead><tr><th scope="col" class="row-label">'+L('Параметр','Параметр')+'</th>'+
    list.map(p=>'<th scope="col" class="'+(p.id===current?'current':'')+'">'+(p.bestselling?'<span class="badge badge-solid">'+L('WAD 75″','WAD 75″')+'</span>':'')+image(p)+'<h3>'+p.family+' '+p.size+'″</h3><div class="small-model">'+p.model+'</div></th>').join('')+'</tr></thead><tbody>'+
    rows.map(([label,get])=>'<tr><th scope="row" class="row-label">'+label+'</th>'+list.map(p=>'<td class="'+(p.id===current?'current':'')+'">'+esc(get(p))+'</td>').join('')+'</tr>').join('')+
    '<tr><th scope="row" class="row-label">'+L('Выбрать модель','Модель таңдау')+'</th>'+list.map(p=>'<td class="'+(p.id===current?'current':'')+'">'+button(L('Выбрать','Таңдау'),'data-action="'+(modal?'compare-select':'spec-select')+'" data-product="'+p.id+'"','btn-outline btn-sm')+'</td>').join('')+'</tr></tbody></table></div>'+
    '<div class="table-notes">'+(list.some(p=>p.id==='flip3')?L('* Flip 3: 4 ввода во встроенном приложении; до 20 — с внешним источником.','* Flip 3: кірістірілген қолданбада 4 енгізу; сыртқы құрылғымен 20-ға дейін.')+'<br>':'')+
    L('Наличие OPS-модуля в комплекте аренды уточняйте при обращении.','Жалдау жинағында OPS модулінің болуын байланыс кезінде нақтылаңыз.')+'</div>';
}
function specifications() {
  const p=BY_ID.get(state.selected)||BY_ID.get('wad75');
  const list=PRODUCTS.filter(x=>x.size===p.size);
  return '<main id="main" class="container page-transition">'+breadcrumbs(L('Характеристики','Сипаттамалар'))+'<div class="page-heading"><h1>'+L('Характеристики панелей Samsung','Samsung панельдерінің сипаттамалары')+'</h1><p>'+L('Выберите модель и сравните основные параметры.','Модельді таңдап, негізгі параметрлерін салыстырыңыз.')+'</p></div>'+
    '<div class="filter-panel spec-selector"><div class="filter-row"><span class="filter-label">'+L('Диагональ','Диагональ')+'</span><div class="chips">'+[65,75,86].map(size=>'<button type="button" class="chip '+(p.size===size?'active':'')+'" data-action="spec-size" data-value="'+size+'" aria-pressed="'+(p.size===size)+'">'+size+'″</button>').join('')+'</div></div>'+
    '<div class="filter-row"><span class="filter-label">'+L('Серия','Серия')+'</span><div class="chips">'+['WAD','WAF','Flip 3','Flip Pro'].map(f=>{
      const match=list.find(x=>x.family===f);
      return '<button type="button" class="chip '+(p.family===f?'active':'')+'" data-action="spec-select" data-product="'+(match?.id||'')+'" '+(!match?'disabled':'')+' aria-pressed="'+(p.family===f)+'">'+f+'</button>';
    }).join('')+'</div></div></div>'+selectedModel(p)+
    '<section class="section"><div class="section-title"><h2>'+L('Сравнение панелей ','Панельдерді салыстыру: ')+p.size+'″</h2><p>'+L('Выберите возможности под свои задачи.','Міндеттеріңізге сай мүмкіндіктерді таңдаңыз.')+'</p></div>'+comparisonTable(list,p.id)+'</section>'+
    cta(L('Поможем выбрать подходящую панель','Лайықты панельді таңдауға көмектесеміз'),L('Обсудим задачи и объясним различия между моделями.','Міндеттеріңізді талқылап, модельдердің айырмашылығын түсіндіреміз.'))+'</main>';
}
function productPage(id) {
  const p=BY_ID.get(id);
  if(!p) return catalog();
  state.selected=p.id;
  const pairs=[
    [L('Модель','Модель'),p.model],[L('Код модели','Модель коды'),p.sku],
    [L('Диагональ','Диагональ'),p.size+'″'],[L('Разрешение','Ажыратымдылық'),p.resolution],
    [L('Операционная система','Операциялық жүйе'),p.os],[L('Тип панели','Панель түрі'),p.panelType],
    [L('Одновременный ввод','Бір уақытта енгізу'),value(p.touch)],[L('Подключения','Қосылымдар'),p.ports]
  ];
  if(p.charge) pairs.push([L('Зарядка через USB-C','USB-C арқылы қуаттау'),L('До '+p.charge+' Вт',p.charge+' Вт-қа дейін')]);
  if(p.latency) pairs.push([L('Задержка письма','Жазу кідірісі'),value(p.latency)]);
  return '<main id="main" class="container page-transition">'+breadcrumbs(esc(value(p.name)),true)+selectedModel(p)+
    '<section class="section product-description"><h2>'+L('Для уроков, встреч и совместной работы','Сабақтарға, кездесулерге және бірлескен жұмысқа')+'</h2><p>'+esc(value(p.description))+'</p><div class="product-highlights">'+p.highlights[state.lang].map(t=>'<div class="highlight-item">'+icon('check')+'<span>'+esc(t)+'</span></div>').join('')+'</div></section>'+
    '<section class="section"><div class="section-title"><h2>'+L('Характеристики','Сипаттамалар')+'</h2></div><div class="detail-specs">'+pairs.map(([k,v])=>'<div class="detail-spec"><span>'+k+'</span><b>'+esc(v)+'</b></div>').join('')+'</div><p class="table-notes">'+L('Наличие OPS-модуля в комплекте аренды уточняйте при обращении. Задержка письма отличается от времени отклика матрицы.','Жалдау жинағында OPS модулінің болуын байланыс кезінде нақтылаңыз. Жазу кідірісі матрицаның жауап уақытынан өзгеше.')+'</p>'+
    '<p class="source-link">'+L('Характеристики: ','Сипаттамалар: ')+'<a href="'+p.sourceURL+'" target="_blank" rel="noopener noreferrer">'+L('официальная страница Samsung','Samsung ресми беті')+'</a></p></section>'+
    '<div class="actions">'+textLink(L('Сравнить с другими моделями','Басқа модельдермен салыстыру'),'#/specifications')+textLink(L('Все панели','Барлық панельдер'),'#/catalog')+'</div>'+cta()+'</main>';
}

function renderCompareTray() {
  document.getElementById('compare-tray')?.remove();
  document.body.classList.toggle('has-compare', state.compare.size>0);
  if(!state.compare.size) return;
  const tray=document.createElement('div');
  tray.id='compare-tray'; tray.className='compare-tray'; tray.setAttribute('aria-label',L('Выбранные для сравнения','Салыстыру үшін таңдалған'));
  tray.innerHTML='<span class="compare-summary" aria-live="polite">'+L('Выбрано: ','Таңдалды: ')+state.compare.size+'/4</span>'+
    button(L('Сравнить','Салыстыру'),'data-action="compare-open" '+(state.compare.size<2?'disabled':''),'btn-sm')+
    '<button type="button" class="clear" data-action="compare-clear">'+L('Очистить','Тазарту')+'</button>';
  app.append(tray);
}
function radioOptions(name, options, selected) {
  return '<div class="radio-options">'+options.map(([v,t])=>'<label class="radio-pill"><input type="radio" name="'+name+'" value="'+esc(v)+'" '+(String(v)===String(selected)?'checked':'')+'>'+t+'</label>').join('')+'</div>';
}
function openModal(content, kind='consult', focusSelector='[data-modal-focus]') {
  closeModal(false);
  previousFocus=document.activeElement;
  modalRoot.innerHTML='<div class="modal-backdrop" data-modal-backdrop>'+content+'</div>';
  document.body.classList.add('modal-open');
  app.inert=true;
  requestAnimationFrame(()=>modalRoot.querySelector(focusSelector)?.focus());
}
function closeModal(restore=true) {
  if(!modalRoot.innerHTML) return;
  modalRoot.innerHTML='';
  document.body.classList.remove('modal-open');
  app.inert=false;
  modalContext=null;
  if(restore && previousFocus?.isConnected) previousFocus.focus();
  previousFocus=null;
}
function standSizeLabel(size) {
  return ['65','75','86'].includes(String(size))
    ? L('Для панели '+size+'″',size+'″ панельге арналған')
    : L('Под выбранную панель','Таңдалған панельге сай');
}
function rentalServices(size) {
  return '<fieldset class="form-field rental-services"><legend>'+L('Добавить к аренде','Жалдауға қосу')+' <span class="optional">'+L('необязательно','міндетті емес')+'</span></legend><div class="service-options">'+
    '<label class="service-option"><input type="checkbox" name="stand" value="yes"><div class="service-photo"><img src="assets/mobile-stand.jpg" alt="'+L('Пример мобильной стойки на колёсах','Дөңгелегі бар мобильді тұғыр мысалы')+'" width="300" height="300" loading="lazy"><small>'+L('Пример стойки','Тұғыр мысалы')+'</small></div><div class="service-copy"><b>'+L('Мобильная стойка','Мобильді тұғыр')+'</b><span data-stand-size>'+standSizeLabel(size)+'</span><small>'+L('Стандартная, на колёсах','Стандартты, дөңгелекті')+'</small></div><span class="service-select">'+L('Добавить стойку','Тұғыр қосу')+'</span></label>'+
    '<label class="service-option service-delivery"><input type="checkbox" name="delivery" value="yes"><div class="service-delivery-art">'+icon('truck')+'</div><div class="service-copy"><b>'+L('Доставка','Жеткізу')+'</b><span data-delivery-city>'+value(cityEntry().delivery)+'</span><small>'+L('Условия согласуем в WhatsApp','Шарттарын WhatsApp-та келісеміз')+'</small></div><span class="service-select">'+L('Добавить доставку','Жеткізуді қосу')+'</span></label></div>'+
    '<p class="service-note">'+L('Стойка подбирается под панель. Комплект и стоимость согласуем в WhatsApp.','Тұғыр панельге сай таңдалады. Жинақ пен бағасын WhatsApp-та келісеміз.')+'</p></fieldset>'+
    '<div class="form-field delivery-address" hidden><label for="consult-delivery-address">'+L('Адрес доставки','Жеткізу мекенжайы')+' <span class="optional">'+L('необязательно','міндетті емес')+'</span></label><input id="consult-delivery-address" name="deliveryAddress" maxlength="300" disabled placeholder="'+L('Улица, дом или здание','Көше, үй немесе ғимарат')+'"></div>';
}
function openConsult(productId='', presetSize='') {
  const p=BY_ID.get(productId);
  const current=route();
  const context=p?value(p.name)+' · '+p.sku:'';
  const size=p?.size||presetSize||'help';
  const purpose=current.page==='education'?'school':'';
  const options=[['school',L('Школа','Мектеп')],['center',L('Учебный центр','Оқу орталығы')],['office',L('Офис','Офис')],['other',L('Другое','Басқа')]];
  openModal('<div class="consult-dialog" role="dialog" aria-modal="true" aria-labelledby="consult-title">'+
    '<button type="button" class="modal-close" data-action="modal-close" aria-label="'+L('Закрыть','Жабу')+'">'+icon('close')+'</button>'+
    '<aside class="consult-visual"><div class="brand white">DARA <span>Touch</span></div><h2>'+L('Samsung в аренду<br>под ваши задачи','Міндеттеріңізге сай<br>Samsung жалға алыңыз')+'</h2><p>'+L('Подберём модель, обсудим срок и стоимость аренды.','Модельді таңдап, жалдау мерзімі мен бағасын талқылаймыз.')+'</p><p class="sizes">65″ · 75″ · 86″</p><div class="consult-image">'+image(p||BY_ID.get('wad75'))+'</div><div class="consult-contacts">'+phoneLinks('consult-phone',true)+instagramLink()+'</div></aside>'+
    '<form class="consult-form" id="consult-form"><h2 id="consult-title">'+L('Заявка на аренду','Жалға алу өтінімі')+'</h2><p>'+L('Заполните форму и продолжите в WhatsApp.','Форманы толтырып, WhatsApp-та жалғастырыңыз.')+'</p>'+
    (context?'<p class="badge" style="margin-bottom:18px">'+esc(value(p.name))+'</p>':'')+
    '<div class="field-row"><div class="form-field"><label for="consult-name">'+L('Ваше имя','Атыңыз')+' <span class="required">*</span></label><input id="consult-name" name="name" autocomplete="name" maxlength="80" required placeholder="'+L('Как к вам обращаться','Сізге қалай жүгінейік')+'" data-modal-focus></div>'+
    '<div class="form-field"><label for="consult-phone">'+L('Телефон / WhatsApp','Телефон / WhatsApp')+' <span class="required">*</span></label><input id="consult-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="25" required placeholder="+7 ___ ___ __ __"></div></div>'+
    '<fieldset class="form-field"><legend>'+L('Для чего нужна панель?','Панель не үшін қажет?')+'</legend>'+radioOptions('purpose',options,purpose)+'</fieldset>'+
    '<fieldset class="form-field"><legend>'+L('Диагональ','Диагональ')+'</legend>'+radioOptions('size',p?[[p.size,p.size+'″']]:[[65,'65″'],[75,'75″'],[86,'86″'],['help',L('Помогите выбрать','Таңдауға көмектесіңіз')]],size)+'</fieldset>'+
    '<fieldset class="form-field"><legend>'+L('Город','Қала')+'</legend>'+radioOptions('city',CITIES.map(c=>[c.id,value(c)]),state.city)+'</fieldset>'+
    rentalServices(size)+
    '<div class="field-row rental-fields"><div class="form-field"><label for="consult-date">'+L('Дата аренды','Жалдау күні')+' <span class="optional">'+L('необязательно','міндетті емес')+'</span></label><input id="consult-date" name="rentalDate" type="date"></div><div class="form-field"><label for="consult-duration">'+L('Срок аренды','Жалдау мерзімі')+' <span class="optional">'+L('необязательно','міндетті емес')+'</span></label><input id="consult-duration" name="rentalDuration" maxlength="100" placeholder="'+L('Например, 1 день или неделя','Мысалы, 1 күн немесе бір апта')+'"></div></div>'+
    '<div class="form-field"><label for="consult-comment">'+L('Комментарий','Қосымша ақпарат')+' <span class="optional">'+L('необязательно','міндетті емес')+'</span></label><textarea id="consult-comment" name="comment" maxlength="1000" placeholder="'+L('Мероприятие и пожелания по аренде','Іс-шара және жалдау туралы тілектеріңіз')+'"></textarea></div>'+
    '<fieldset class="form-field whatsapp-recipient"><legend>'+L('Выберите номер WhatsApp','WhatsApp нөмірін таңдаңыз')+' <span class="required">*</span></legend><div class="recipient-options">'+CONTACTS.map(c=>'<label class="recipient-card"><input type="radio" name="destination" value="'+c.digits+'" required>'+icon('wa')+'<span>'+c.phone+'</span></label>').join('')+'</div></fieldset>'+
    '<button type="submit" class="btn btn-wa btn-full">'+icon('wa')+L('Продолжить в WhatsApp','WhatsApp-та жалғастыру')+'</button>'+
    '<p class="wa-helper">'+L('Откроется чат с выбранным номером и готовым сообщением.<br>Проверьте и отправьте его в WhatsApp.','Таңдалған нөмірдің чаты дайын хабарламамен ашылады.<br>Оны тексеріп, WhatsApp-та жіберіңіз.')+'</p><div class="form-feedback" id="form-feedback" aria-live="polite"></div></form></div>');
  modalContext={product:context,lang:state.lang,purposes:Object.fromEntries(options)};
}
function openComparison() {
  const list=[...state.compare].map(id=>BY_ID.get(id)).filter(Boolean);
  if(list.length<2) return;
  openModal('<div class="compare-dialog" role="dialog" aria-modal="true" aria-labelledby="compare-title"><button type="button" class="modal-close" data-action="modal-close" aria-label="'+L('Закрыть','Жабу')+'">'+icon('close')+'</button><h2 id="compare-title" tabindex="-1" data-modal-focus>'+L('Сравнение выбранных моделей','Таңдалған модельдерді салыстыру')+'</h2>'+comparisonTable(list,'',true)+'</div>','compare');
}
function openInfo(type) {
  let content;
  if(type==='contacts') {
    content='<h2 id="info-title">'+L('Свяжитесь с DARA Touch','DARA Touch-пен байланысыңыз')+'</h2><p>'+L('Подберём интерактивную панель Samsung в аренду для обучения, мероприятий и встреч.','Оқытуға, іс-шараларға және кездесулерге Samsung интерактивті панелін жалға таңдауға көмектесеміз.')+'</p><div class="contact-list">'+CONTACTS.map(c=>'<div class="contact-item"><a class="contact-large" href="tel:+'+c.digits+'">'+c.phone+'</a><a class="text-link" href="https://wa.me/'+c.digits+'" target="_blank" rel="noopener noreferrer">'+icon('wa')+'WhatsApp</a></div>').join('')+'</div>'+instagramLink()+'<div class="actions">'+consultation(L('Заявка на аренду','Жалға алу өтінімі'))+'</div>';
  } else {
    content='<h2 id="info-title">'+L('Данные формы','Форма деректері')+'</h2><p>'+L('Введённые имя, телефон и выбранные параметры используются для подготовки сообщения в WhatsApp. Форма не сохраняет их в базе данных DARA Touch.','Енгізілген атыңыз, телефоныңыз және таңдалған параметрлер WhatsApp хабарламасын дайындауға пайдаланылады. Форма оларды DARA Touch дерекқорында сақтамайды.')+'</p><p>'+L('При переходе в WhatsApp подготовленный текст передаётся этому сервису. Вы проверяете и отправляете сообщение сами.','WhatsApp-қа өткенде дайын мәтін осы сервиске беріледі. Хабарламаны өзіңіз тексеріп, жібересіз.')+'</p><p>'+L('Сайт запоминает только выбранные язык и город в вашем браузере. Изменить их можно в верхней части страницы.','Сайт браузеріңізде тек таңдалған тіл мен қаланы есте сақтайды. Оларды беттің жоғарғы жағынан өзгерте аласыз.')+'</p>';
  }
  openModal('<div class="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title"><button type="button" class="modal-close" data-action="modal-close" data-modal-focus aria-label="'+L('Закрыть','Жабу')+'">'+icon('close')+'</button>'+content+'</div>','info');
}
function applyRoute() {
  const r=route();
  if(r.page==='catalog' && r.params.has('size')) {
    const size=r.params.get('size');
    state.filters={size:['65','75','86'].includes(size)?size:'all',family:'all',search:'',sort:'popular'};
  }
  if(r.page==='specifications' && BY_ID.has(r.params.get('model'))) state.selected=r.params.get('model');
  state.menu=false;
}
function render(scroll=false) {
  const r=route();
  const p=BY_ID.get(r.id)||BY_ID.get('wad75');
  const body=r.page==='home'?home():r.page==='catalog'?catalog():r.page==='education'?education():r.page==='specifications'?specifications():productPage(r.id);
  const titles={home:L('Аренда панелей Samsung','Samsung панельдерін жалға беру'),catalog:L('Каталог','Каталог'),education:L('Для образования','Білім беру үшін'),specifications:L('Характеристики','Сипаттамалар'),product:value(p.name)};
  document.title='DARA Touch — '+titles[r.page];
  document.documentElement.lang=state.lang==='ru'?'ru':'kk';
  document.querySelector('.skip-link').textContent=L('Перейти к содержимому','Мазмұнға өту');
  app.innerHTML=cityBar()+header(r.page==='product'?'catalog':r.page)+subbar(r.page,p)+body+footer();
  renderCompareTray();
  if(scroll) window.scrollTo({top:0,behavior:'instant'});
}
function updateCatalogGrid() {
  const grid=document.getElementById('catalog-grid');
  if(grid) grid.innerHTML=catalogProducts();
  const count=document.getElementById('catalog-count');
  if(count) count.textContent=catalogCount();
  renderCompareTray();
}
function handleClick(event) {
  const buttonEl=event.target.closest('[data-action]');
  if(!buttonEl) {
    if(event.target.matches('[data-modal-backdrop]')) closeModal();
    return;
  }
  const {action}=buttonEl.dataset;
  if(action==='consult') openConsult(buttonEl.dataset.product||'',buttonEl.dataset.size||'');
  else if(action==='modal-close') closeModal();
  else if(action==='contacts' || action==='privacy') openInfo(action);
  else if(action==='city') setCity(buttonEl.dataset.city);
  else if(action==='lang') {
    state.lang=buttonEl.dataset.lang==='kz'?'kz':'ru';
    savePreference('dara-lang',state.lang);
    render();
    app.querySelector('[data-action="lang"][data-lang="'+state.lang+'"]')?.focus();
  } else if(action==='menu') {
    state.menu=!state.menu;
    const nav=app.querySelector('.nav');
    nav.classList.toggle('open',state.menu);
    buttonEl.setAttribute('aria-expanded',String(state.menu));
    buttonEl.innerHTML=icon(state.menu?'close':'menu');
    buttonEl.setAttribute('aria-label',L(state.menu?'Закрыть меню':'Открыть меню',state.menu?'Мәзірді жабу':'Мәзірді ашу'));
  } else if(action==='filter') {
    state.filters[buttonEl.dataset.filter]=buttonEl.dataset.value;
    render();
    app.querySelector('[data-action="filter"][data-filter="'+buttonEl.dataset.filter+'"][data-value="'+buttonEl.dataset.value+'"]')?.focus();
  } else if(action==='reset-filters') {
    state.filters={size:'all',family:'all',search:'',sort:'popular'};
    render();
  } else if(action==='spec-size') {
    const size=Number(buttonEl.dataset.value);
    const current=BY_ID.get(state.selected);
    state.selected=(PRODUCTS.find(p=>p.size===size && p.family===current.family)||PRODUCTS.find(p=>p.size===size)).id;
    render();
    app.querySelector('[data-action="spec-size"][data-value="'+size+'"]')?.focus();
  } else if(action==='spec-select') {
    if(BY_ID.has(buttonEl.dataset.product)) state.selected=buttonEl.dataset.product;
    render();
    app.querySelector('.spec-selector [data-product="'+state.selected+'"]')?.focus();
  } else if(action==='compare-select') {
    const id=buttonEl.dataset.product;
    closeModal();
    state.selected=id;
    if(location.hash==='#/product/'+id) render(true); else location.hash='/product/'+id;
  } else if(action==='compare-open') openComparison();
  else if(action==='compare-clear') {
    state.compare.clear();
    document.querySelectorAll('[data-compare]').forEach(i=>i.checked=false);
    renderCompareTray();
  } else if(action==='gallery') {
    state.gallery=buttonEl.dataset.gallery;
    const img=app.querySelector('.gallery-main');
    img.src=state.gallery==='classroom'?'assets/classroom.png':BY_ID.get('wad75').image;
    img.alt=state.gallery==='classroom'?L('Пример урока с панелью Samsung','Samsung панелімен сабақ мысалы'):value(BY_ID.get('wad75').imageAlt);
    img.closest('.gallery').dataset.mode=state.gallery;
    app.querySelectorAll('[data-action="gallery"]').forEach(b=>{const selected=b.dataset.gallery===state.gallery;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  }
}
app.addEventListener('click',handleClick);
modalRoot.addEventListener('click',handleClick);
app.addEventListener('input',event=>{
  if(event.target.id==='catalog-search') {state.filters.search=event.target.value;updateCatalogGrid();}
});
app.addEventListener('change',event=>{
  if(event.target.id==='catalog-sort') {state.filters.sort=event.target.value;updateCatalogGrid();}
  if(event.target.matches('[data-compare]')) {
    const id=event.target.dataset.compare;
    if(event.target.checked) {
      if(state.compare.size>=4) {
        event.target.checked=false;
        const summary=document.querySelector('.compare-summary');
        if(summary) summary.textContent=L('Можно сравнить до 4 моделей','4 модельге дейін салыстыруға болады');
        return;
      }
      state.compare.add(id);
    } else state.compare.delete(id);
    renderCompareTray();
  }
});
modalRoot.addEventListener('input',event=>{
  if(event.target instanceof HTMLInputElement) event.target.setCustomValidity('');
  const feedback=modalRoot.querySelector('#form-feedback');
  if(feedback) feedback.innerHTML='';
});
modalRoot.addEventListener('change',event=>{
  const target=event.target;
  if(target.name==='size') {
    const caption=modalRoot.querySelector('[data-stand-size]');
    if(caption) caption.textContent=standSizeLabel(target.value);
  }
  if(target.name==='city') setCity(target.value);
  if(target.name==='delivery') {
    const field=modalRoot.querySelector('.delivery-address');
    field.hidden=!target.checked;
    field.querySelector('input').disabled=!target.checked;
  }
});
modalRoot.addEventListener('submit',event=>{
  if(event.target.id!=='consult-form') return;
  event.preventDefault();
  const form=event.target;
  const name=form.elements.name;
  const phone=form.elements.phone;
  name.setCustomValidity(name.value.trim()? '':L('Укажите ваше имя.','Атыңызды жазыңыз.'));
  const digits=phone.value.replace(/\D/g,'');
  phone.setCustomValidity(/^[+\d\s()\-]+$/.test(phone.value) && digits.length>=10 && digits.length<=15?'':L('Введите телефон с кодом страны, например +7 707 123 45 67.','Ел кодымен телефонды жазыңыз, мысалы +7 707 123 45 67.'));
  if(!form.reportValidity()) return;
  const fields=new FormData(form);
  const purpose=modalContext?.purposes[fields.get('purpose')]||'';
  const destination=fields.get('destination');
  const recipient=CONTACTS.find(contact=>contact.digits===destination);
  if(!recipient) return;
  const url=buildWhatsAppURL({destination,name:name.value.trim(),phone:phone.value.trim(),city:fields.get('city')||state.city,purpose,size:fields.get('size')||'help',comment:fields.get('comment'),rentalDate:fields.get('rentalDate'),rentalDuration:fields.get('rentalDuration'),stand:fields.has('stand'),delivery:fields.has('delivery'),deliveryAddress:fields.get('deliveryAddress'),product:modalContext?.product||'',lang:state.lang});
  const opened=window.open(url,'_blank','noopener,noreferrer');
  const status=form.querySelector('#form-feedback');
  status.innerHTML=L('Выбран номер: ','Таңдалған нөмір: ')+recipient.phone+'. '+L('Продолжите в WhatsApp. Если окно не открылось, ','WhatsApp-та жалғастырыңыз. Терезе ашылмаса, ')+
    '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+L('откройте чат по ссылке','сілтеме арқылы чатқа өтіңіз')+'</a>.';
});
document.addEventListener('keydown',event=>{
  if(!modalRoot.innerHTML) return;
  if(event.key==='Escape') {event.preventDefault();closeModal();return;}
  if(event.key==='Tab') {
    const focusable=[...modalRoot.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex="0"]')].filter(el=>el.getClientRects().length>0);
    if(!focusable.length) return;
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey && (document.activeElement===first || !focusable.includes(document.activeElement))) {event.preventDefault();last.focus();}
    else if(!event.shiftKey && (document.activeElement===last || !focusable.includes(document.activeElement))) {event.preventDefault();first.focus();}
  }
});
window.addEventListener('hashchange',()=>{
  if(location.hash==='#main') return;
  closeModal();
  applyRoute();
  state.gallery='front';
  render(true);
});
applyRoute();
render();
