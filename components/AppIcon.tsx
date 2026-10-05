// PWA icon-ийн зураг (ImageResponse-д ашиглана): бараан дэвсгэр, тэнгэрийн хаяа дээрх нар
export function AppIconArt({ size }: { size: number }) {
  const sun = size * 0.46;
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#1c1917",
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (size - sun) / 2,
          top: size * 0.3,
          width: sun,
          height: sun,
          borderRadius: sun,
          background: "#fbbf24",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: size * 0.62,
          width: size,
          height: size * 0.38,
          background: "#1c1917",
          borderTop: `${Math.max(2, size * 0.025)}px solid #fbbf24`,
        }}
      />
    </div>
  );
}
