export const WHATSAPP_CONTACTS = Object.freeze([
  Object.freeze({ phone: '+7 776 461 92 92', digits: '77764619292' }),
  Object.freeze({ phone: '+7 707 776 01 05', digits: '77077760105' }),
]);

export const CITIES = Object.freeze([
  Object.freeze({
    id: 'astana',
    ru: 'Астана',
    kz: 'Астана',
    delivery: Object.freeze({ ru: 'По Астане', kz: 'Астана бойынша' }),
  }),
  Object.freeze({
    id: 'almaty',
    ru: 'Алматы',
    kz: 'Алматы',
    delivery: Object.freeze({ ru: 'По Алматы', kz: 'Алматы бойынша' }),
  }),
]);

function normalized(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .trim();
}

export function escapeHtml(value) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

export function filterProducts(
  products,
  { size = 'all', family = 'all', search = '', sort = 'popular' } = {},
) {
  const selectedSize = normalized(size);
  const selectedFamily = normalized(family);
  const searchTerms = normalized(search).split(' ').filter(Boolean);

  const matches = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => {
      if (selectedSize !== 'all' && Number(product.size) !== Number(selectedSize)) {
        return false;
      }
      if (selectedFamily !== 'all' && normalized(product.family) !== selectedFamily) {
        return false;
      }
      const searchable = normalized([
        product.name?.ru,
        product.name?.kz,
        product.sku,
        product.model,
        product.os,
      ].filter(value => value != null).join(' '));
      return searchTerms.every(term => searchable.includes(term));
    });

  matches.sort((left, right) => {
    let difference;
    if (sort === 'sizeAsc') {
      difference = Number(left.product.size) - Number(right.product.size);
    } else if (sort === 'sizeDesc') {
      difference = Number(right.product.size) - Number(left.product.size);
    } else {
      difference = Number(Boolean(right.product.bestselling)) - Number(Boolean(left.product.bestselling));
    }
    return difference || left.index - right.index;
  });

  return matches.map(({ product }) => product);
}

export function buildWhatsAppURL({
  name,
  phone,
  city,
  purpose,
  size,
  comment,
  product,
  rentalDate,
  rentalDuration,
  stand = false,
  delivery = false,
  deliveryAddress = '',
  lang = 'ru',
  destination = WHATSAPP_CONTACTS[0].digits,
} = {}) {
  if (!WHATSAPP_CONTACTS.some(contact => contact.digits === destination)) {
    throw new RangeError('Choose one of the available WhatsApp contacts.');
  }
  const kazakh = lang === 'kz';
  const labels = kazakh
    ? {
      name: 'Аты',
      phone: 'Телефон',
      city: 'Қала',
      purpose: 'Қолдану мақсаты',
      size: 'Диагональ',
      product: 'Модель',
      rentalDate: 'Жалға алу күні',
      rentalDuration: 'Жалға алу мерзімі',
      stand: 'Мобильді тұғыр',
      delivery: 'Жеткізу',
      deliveryAddress: 'Жеткізу мекенжайы',
      comment: 'Қосымша ақпарат',
    }
    : {
      name: 'Имя',
      phone: 'Телефон',
      city: 'Город',
      purpose: 'Назначение',
      size: 'Диагональ',
      product: 'Модель',
      rentalDate: 'Дата аренды',
      rentalDuration: 'Срок аренды',
      stand: 'Мобильная стойка',
      delivery: 'Доставка',
      deliveryAddress: 'Адрес доставки',
      comment: 'Комментарий',
    };
  const lines = [kazakh
    ? 'Сәлеметсіз бе! Samsung интерактивті панелін DARA Touch-тан жалға алғым келеді.'
    : 'Здравствуйте! Хочу арендовать интерактивную панель Samsung у DARA Touch.'];
  const fields = { name, phone, city, purpose, size, product, rentalDate, rentalDuration, comment };

  for (const [key, value] of Object.entries(fields)) {
    let text = String(value ?? '').trim();
    if (!text) continue;
    if (key === 'city') {
      const knownCity = CITIES.find(item => item.id === text);
      if (knownCity) text = kazakh ? knownCity.kz : knownCity.ru;
    }
    if (key === 'size' && /^(65|75|86)$/.test(text)) text += '″';
    if (key === 'size' && ['help', 'help-choose'].includes(normalized(text))) {
      text = kazakh ? 'Таңдауға көмектесіңіз' : 'Помогите выбрать';
    }
    if (key === 'rentalDate') {
      const dateParts = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateParts) text = `${dateParts[3]}.${dateParts[2]}.${dateParts[1]}`;
    }
    lines.push(`${labels[key]}: ${text}`);
  }

  if (stand) {
    const diagonal = String(size ?? '').trim();
    const knownSize = /^(65|75|86)$/.test(diagonal);
    const standDescription = knownSize
      ? (kazakh ? `${diagonal}″ панельге арналған` : `для панели ${diagonal}″`)
      : (kazakh ? 'панельге сай таңдау' : 'подбор под панель');
    lines.push(`${labels.stand}: ${standDescription}`);
  }
  if (delivery) {
    lines.push(`${labels.delivery}: ${kazakh ? 'Иә' : 'Да'}`);
    const address = String(deliveryAddress ?? '').trim();
    if (address) lines.push(`${labels.deliveryAddress}: ${address}`);
  }

  const url = new URL(`https://wa.me/${destination}`);
  url.search = `?text=${encodeURIComponent(lines.join('\n'))}`;
  return url.href;
}
