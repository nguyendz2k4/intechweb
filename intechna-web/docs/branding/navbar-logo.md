# Navbar logo

Asset: `public/images/brand/intech-logo.png`.

Source: the orange Intech logo supplied by the owner on 17 October 2026.
Prepared with the built-in imagegen tool, using a transparent background.
The original attachment was not overwritten.

Final imagegen prompt:

> Use case: background-extraction. Edit target: attached original Intech company logo. Remove only the white background, making all background areas truly transparent, and crop the canvas tightly to the existing orange logo including its full small tagline with 2% padding. Output a wide horizontal transparent PNG. Preserve the exact original shape, proportions, orange color (#ffb23e approximately), letterforms, and all original text: stylized 'iNTech' and 'International Technology'. No redrawing, redesign, additions, shadows, gradients or color changes. Keep the original pixels and edges as faithfully as possible. This asset is for the company's website navbar on a black background.

The navbar uses Next Image optimization and CSS framing to display the logo on desktop and mobile.

## Browser and home-screen icons

All favicon variants use this same navbar asset on the navbar's pale blue background (`#e7f0f7`).
`public/favicon.svg` embeds the logo; `node scripts/generate-brand-icons.mjs` renders the square
PNG (48 px), Apple touch icon (180 px), and ICO (16/32/48 px) with Next's HTML/CSS ImageResponse renderer.
The generator does not redraw or change the source logo. The root metadata uses versioned
`intech-gold-3` URLs for the SVG, PNG, ICO, and Apple icon to refresh cached browser icons.
