// Profile icons: small illustrated pictures kids can pick from.
// Each one is drawn on a 48×48 grid with a soft round background.
const sunflowerPetals = Array.from({ length: 12 }, (_, i) =>
  `<ellipse cx="24" cy="11.5" rx="3" ry="6" fill="#f5c242" transform="rotate(${i * 30} 24 20)"/>`).join("");

const avatars = {
  rose: { label: "Rose", svg: `
    <circle cx="24" cy="24" r="24" fill="#fde4ea"/>
    <path d="M24 27 V42" stroke="#4f9a5a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 35 C19 35 16 31 16 31 C21 30 24 32 24 35Z" fill="#5fae6b"/>
    <path d="M24 38 C29 38 32 34 32 34 C27 33 24 35 24 38Z" fill="#5fae6b"/>
    <circle cx="24" cy="19" r="9" fill="#e05a7a"/>
    <path d="M24 13 C28 13 30 16 29 18.5 C28 21 24.5 21 23.5 19 C22.7 17.3 24.5 16 26 16.8" fill="none" stroke="#b83a5c" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M16.5 21 C18 25 21 26.5 24 26.5 C27 26.5 30 25 31.5 21" fill="none" stroke="#b83a5c" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>` },

  tulip: { label: "Tulip", svg: `
    <circle cx="24" cy="24" r="24" fill="#fff0d9"/>
    <path d="M24 27 V42" stroke="#4f9a5a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 41 C17 39 14 32 15 27 C20 30 23 35 24 41Z" fill="#5fae6b"/>
    <path d="M24 39 C30 37 33 31 32 28 C28 30 25 34 24 39Z" fill="#4f9a5a"/>
    <path d="M16 13 L20 17.5 L24 11 L28 17.5 L32 13 L31 22 C30 26.5 27 28.5 24 28.5 C21 28.5 18 26.5 17 22 Z" fill="#f08a5d"/>
    <path d="M24 11 L24 28.5" stroke="#d96a3d" stroke-width="1.2" opacity="0.5"/>` },

  sunflower: { label: "Sunflower", svg: `
    <circle cx="24" cy="24" r="24" fill="#e8f3ff"/>
    <path d="M24 28 V44" stroke="#4f9a5a" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 37 C29 37 32 33 32 33 C27 32 24 34 24 37Z" fill="#5fae6b"/>
    ${sunflowerPetals}
    <circle cx="24" cy="20" r="6" fill="#7a4a22"/>
    <circle cx="22" cy="18.5" r="0.9" fill="#5c3517"/><circle cx="25.5" cy="19" r="0.9" fill="#5c3517"/><circle cx="23.5" cy="22" r="0.9" fill="#5c3517"/>` },

  cactus: { label: "Cactus", svg: `
    <circle cx="24" cy="24" r="24" fill="#e6f4e6"/>
    <rect x="20" y="12" width="8" height="21" rx="4" fill="#5aa469"/>
    <rect x="14" y="18" width="4" height="9" rx="2" fill="#5aa469"/>
    <rect x="16" y="23" width="5" height="4" fill="#5aa469"/>
    <rect x="30" y="15" width="4" height="9" rx="2" fill="#5aa469"/>
    <rect x="27" y="20" width="5" height="4" fill="#5aa469"/>
    <path d="M24 15 V31" stroke="#468a55" stroke-width="1" opacity="0.6"/>
    <circle cx="24" cy="12" r="2.5" fill="#f07aa0"/>
    <path d="M15 33 H33 L31 42 H17 Z" fill="#d9825b"/>
    <rect x="14" y="31" width="20" height="4" rx="1.5" fill="#c56f49"/>` },

  plant: { label: "House plant", svg: `
    <circle cx="24" cy="24" r="24" fill="#eef6e9"/>
    <path d="M24 32 L24 20 M24 30 L18 22 M24 30 L30 22" stroke="#3f8f5a" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="17" cy="19" rx="4.5" ry="8" fill="#5fae6b" transform="rotate(-35 17 19)"/>
    <ellipse cx="31" cy="19" rx="4.5" ry="8" fill="#5fae6b" transform="rotate(35 31 19)"/>
    <ellipse cx="24" cy="14" rx="4.5" ry="9" fill="#3f8f5a"/>
    <path d="M24 7 V21" stroke="#2f7347" stroke-width="1" opacity="0.6"/>
    <path d="M16 32 H32 L30 42 H18 Z" fill="#e9c46a"/>
    <rect x="15" y="30" width="18" height="4" rx="1.5" fill="#d9b24f"/>` },

  olive: { label: "Olive branch", svg: `
    <circle cx="24" cy="24" r="24" fill="#f4f1e1"/>
    <path d="M12 37 C20 31 28 23 36 11" fill="none" stroke="#7a6a3a" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="18" cy="29" rx="2.5" ry="5.5" fill="#8aa35a" transform="rotate(-60 18 29)"/>
    <ellipse cx="20" cy="35" rx="2.5" ry="5.5" fill="#9cb56a" transform="rotate(30 20 35)"/>
    <ellipse cx="25" cy="21" rx="2.5" ry="5.5" fill="#8aa35a" transform="rotate(-60 25 21)"/>
    <ellipse cx="29" cy="27" rx="2.5" ry="5.5" fill="#9cb56a" transform="rotate(30 29 27)"/>
    <ellipse cx="31" cy="14" rx="2.2" ry="5" fill="#8aa35a" transform="rotate(-55 31 14)"/>
    <ellipse cx="35" cy="19" rx="2.2" ry="5" fill="#9cb56a" transform="rotate(35 35 19)"/>
    <circle cx="23" cy="30" r="2.3" fill="#4b5d2a"/><circle cx="30" cy="20" r="2.1" fill="#4b5d2a"/>` },

  palm: { label: "Date palm", svg: `
    <circle cx="24" cy="24" r="24" fill="#fdf0dc"/>
    <ellipse cx="24" cy="42" rx="11" ry="2.5" fill="#e8d3a8"/>
    <path d="M23 21 C24 29 23 35 22 42 H26 C26.5 35 26 29 25 21Z" fill="#a0703f"/>
    <path d="M24 20 C18 14 11 15 7 21 C13 18 19 18 24 21Z" fill="#4f9a5a"/>
    <path d="M24 20 C30 14 37 15 41 21 C35 18 29 18 24 21Z" fill="#4f9a5a"/>
    <path d="M24 20 C21 12 15 9 10 10 C16 12 20 15 24 20Z" fill="#5fae6b"/>
    <path d="M24 20 C27 12 33 9 38 10 C32 12 28 15 24 20Z" fill="#5fae6b"/>
    <path d="M24 20 C23 13 24 8 26 6 C26 11 25.5 15 24 20Z" fill="#3f8f5a"/>
    <circle cx="22" cy="23" r="1.6" fill="#b5542f"/><circle cx="26" cy="23" r="1.6" fill="#b5542f"/><circle cx="24" cy="24.5" r="1.6" fill="#9c4526"/>` },

  rug: { label: "Prayer rug", svg: `
    <circle cx="24" cy="24" r="24" fill="#e9e4f7"/>
    <path d="M16 6.5 V8.5 M18 6.5 V8.5 M20 6.5 V8.5 M22 6.5 V8.5 M24 6.5 V8.5 M26 6.5 V8.5 M28 6.5 V8.5 M30 6.5 V8.5 M32 6.5 V8.5 M16 39.5 V41.5 M18 39.5 V41.5 M20 39.5 V41.5 M22 39.5 V41.5 M24 39.5 V41.5 M26 39.5 V41.5 M28 39.5 V41.5 M30 39.5 V41.5 M32 39.5 V41.5" stroke="#c9a227" stroke-width="1"/>
    <rect x="14" y="8" width="20" height="32" rx="2" fill="#b33a4a"/>
    <rect x="16.5" y="10.5" width="15" height="27" rx="1" fill="none" stroke="#f2c95c" stroke-width="1.4"/>
    <path d="M19.5 35 V21 C19.5 16.5 24 14 24 14 C24 14 28.5 16.5 28.5 21 V35 Z" fill="#8c2a3a" stroke="#f2c95c" stroke-width="1"/>
    <path d="M24 24 L26 27 L24 30 L22 27 Z" fill="#f2c95c"/>` },

  quran: { label: "Quran", svg: `
    <circle cx="24" cy="24" r="24" fill="#e3f1ec"/>
    <path d="M14 41 L34 27 M34 41 L14 27" stroke="#8b5a2b" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 30 L12 25.5 V12.5 L24 17.5 Z" fill="#fffaf0" stroke="#2f7a5a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M24 30 L36 25.5 V12.5 L24 17.5 Z" fill="#fffaf0" stroke="#2f7a5a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M15 17 L21 19.4 M15 20 L21 22.4 M15 23 L21 25.4 M33 17 L27 19.4 M33 20 L27 22.4 M33 23 L27 25.4" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/>
    <path d="M24 17.5 V30" stroke="#2f7a5a" stroke-width="1.5"/>` },

  mosque: { label: "Mosque", svg: `
    <circle cx="24" cy="24" r="24" fill="#e4ecf8"/>
    <rect x="8" y="19" width="4" height="22" fill="#f4eedf"/>
    <path d="M7.5 19 L10 13 L12.5 19 Z" fill="#d9b44a"/>
    <rect x="36" y="19" width="4" height="22" fill="#f4eedf"/>
    <path d="M35.5 19 L38 13 L40.5 19 Z" fill="#d9b44a"/>
    <rect x="13" y="28" width="22" height="13" fill="#f4eedf"/>
    <path d="M15 28 C15 21 19.5 17 24 15 C28.5 17 33 21 33 28 Z" fill="#d9b44a"/>
    <path d="M24 15 V11" stroke="#b8902f" stroke-width="1.4"/>
    <circle cx="24" cy="9.8" r="1.6" fill="#b8902f"/>
    <path d="M21 41 V35 A3 3 0 0 1 27 35 V41 Z" fill="#1f3a60"/>
    <path d="M16 35 V32 A1.5 1.5 0 0 1 19 32 V35 Z M29 35 V32 A1.5 1.5 0 0 1 32 32 V35 Z" fill="#7a96c2"/>
    <rect x="6" y="41" width="36" height="1.5" rx="0.75" fill="#c9d6ea"/>` },

  crescent: { label: "Crescent moon", svg: `
    <circle cx="24" cy="24" r="24" fill="#1f3a60"/>
    <circle cx="22" cy="25" r="11" fill="#e0bd52"/>
    <circle cx="26.5" cy="22.5" r="9.5" fill="#1f3a60"/>
    <polygon points="34,14 35,16.6 37.8,16.8 35.6,18.5 36.4,21.2 34,19.7 31.6,21.2 32.4,18.5 30.2,16.8 33,16.6" fill="#fff8e6"/>
    <circle cx="13" cy="13" r="0.9" fill="#fff8e6"/><circle cx="37" cy="31" r="0.8" fill="#fff8e6"/><circle cx="29" cy="38" r="0.7" fill="#fff8e6"/>` },

  lantern: { label: "Lantern", svg: `
    <circle cx="24" cy="24" r="24" fill="#fbefd2"/>
    <g transform="translate(9.5 5) scale(0.9)">
      <circle cx="16" cy="4" r="2.6" fill="none" stroke="#1f3a60" stroke-width="1.8"/>
      <path d="M8.5 11.5 L16 6.5 L23.5 11.5 Z" fill="#1f3a60"/>
      <rect x="7.5" y="11" width="17" height="2.6" rx="1.2" fill="#1f3a60"/>
      <path d="M10 13.6 H22 L23.4 29.4 H8.6 Z" fill="#e0bd52"/>
      <path d="M16 17.5 C18.6 20.5 18.8 23 18.2 24.6 C17.7 26 16.9 26.6 16 26.6 C15.1 26.6 14.3 26 13.8 24.6 C13.2 23 13.4 20.5 16 17.5 Z" fill="#fff8e6"/>
      <rect x="6.5" y="29.2" width="19" height="3" rx="1.3" fill="#1f3a60"/>
      <rect x="10" y="32.2" width="12" height="2.4" rx="1" fill="#1f3a60"/>
    </g>` },
};

const avatarKeys = Object.keys(avatars);

function avatarSvg(key) {
  const a = avatars[key] || avatars.lantern;
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${a.svg}</svg>`;
}
