import fs from 'fs';

const monogramPaths = `
    <!-- Letter R Stem & Serifs -->
    <path d="M 295 265 L 372 265 L 372 432 L 372 546 Q 372 576, 408 580 L 295 580 Q 330 576, 330 546 L 330 305 Q 330 265, 295 265 Z" />
    
    <!-- Letter R Bowl Outer & Inner Counter -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="M 372 265 C 458 265, 542 285, 542 348 C 542 412, 458 432, 372 432 Z M 372 295 C 428 295, 488 310, 488 348 C 488 388, 428 402, 372 402 Z" />
    
    <!-- Letter R Leg (parallel to razor slash) -->
    <path d="M 400 426 C 420 426, 442 434, 456 450 L 488 518 C 492 526, 486 534, 474 534 L 452 534 L 420 472 C 412 456, 400 448, 385 448 L 372 448 L 372 426 Z" />
    
    <!-- Razor Diagonal Slash -->
    <path d="M 416 644 L 570 384 L 577 388 L 423 648 Z" />
    
    <!-- Letter P Stem & Serif -->
    <path d="M 508 492 L 555 412 L 555 650 Q 555 680, 588 685 L 480 685 Q 508 680, 508 650 Z" />
    
    <!-- Letter P Bowl Outer & Inner Counter -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="M 555 385 C 638 385, 710 405, 710 468 C 710 530, 638 550, 555 550 Z M 555 415 C 612 415, 656 430, 656 468 C 656 505, 612 520, 555 520 Z" />
`;

// 1. rp_monogram.svg (Tight viewBox: 280 250 445 450)
const rpMonogramSvg = `<svg viewBox="280 250 445 450" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g fill="currentColor">
${monogramPaths}
  </g>
</svg>
`;
fs.writeFileSync('public/rp_monogram.svg', rpMonogramSvg);

// 2. raj_pandya_logo.svg (Exact replica of Image 1 in 1000x1000 viewBox)
const fullLogoSvg = `<svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g fill="#171A18">
${monogramPaths}
  </g>
  
  <!-- "R A J   P A N D Y A" -->
  <text 
    x="500" 
    y="812" 
    text-anchor="middle" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-weight="700" 
    font-size="52" 
    letter-spacing="0.38em" 
    fill="#171A18"
  >
    RAJ PANDYA
  </text>

  <!-- "P R O D U C T   M A N A G E R" -->
  <text 
    x="500" 
    y="878" 
    text-anchor="middle" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-weight="400" 
    font-size="23" 
    letter-spacing="0.55em" 
    fill="#171A18"
  >
    PRODUCT MANAGER
  </text>
</svg>
`;
fs.writeFileSync('public/raj_pandya_logo.svg', fullLogoSvg);

// 3. raj_pandya_logo_horizontal.svg
const horizLogoSvg = `<svg viewBox="0 0 540 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Monogram on left -->
  <g fill="#171A18" transform="translate(10, 8) scale(0.24)">
    <g transform="translate(-280, -250)">
${monogramPaths}
    </g>
  </g>
  
  <!-- "RAJ PANDYA" -->
  <text 
    x="142" 
    y="60" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-weight="700" 
    font-size="30" 
    letter-spacing="0.28em" 
    fill="#171A18"
  >
    RAJ PANDYA
  </text>

  <!-- "PRODUCT MANAGER" -->
  <text 
    x="144" 
    y="88" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-weight="400" 
    font-size="13.5" 
    letter-spacing="0.48em" 
    fill="#77736B"
  >
    PRODUCT MANAGER
  </text>
</svg>
`;
fs.writeFileSync('public/raj_pandya_logo_horizontal.svg', horizLogoSvg);

// 4. favicon.svg
const faviconSvg = `<svg viewBox="260 230 485 490" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="260" y="230" width="485" height="490" fill="#171A18" rx="100"/>
  <g fill="#F7F4ED">
${monogramPaths}
  </g>
</svg>
`;
fs.writeFileSync('public/favicon.svg', faviconSvg);

console.log('Successfully wrote all 4 brand SVG assets!');
