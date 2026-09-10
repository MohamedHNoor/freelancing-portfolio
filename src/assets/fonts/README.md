# Fonts

`SpaceGrotesk-Bold.ttf` is the static Bold (700) instance of Space Grotesk, from
the upstream project at https://github.com/floriankarsten/space-grotesk, under
the SIL Open Font License 1.1 in `OFL.txt`.

It exists only for the generated Open Graph images. `ImageResponse` renders
outside the browser and cannot use `next/font`, so the face has to be read from
disk as a file. It is committed rather than downloaded during the build: a build
that fetches a font from a CDN fails whenever that CDN does, and the social card
is not worth that dependency.

The rest of the site loads Space Grotesk through `next/font/google` in
`src/app/layout.tsx`. This file is not served to browsers.
