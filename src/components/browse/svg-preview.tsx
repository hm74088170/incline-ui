type Props = { svg: string; name: string; size: number; color?: string };

// svg upload ke waqt server par sanitize ho chuki hoti hai (script, onload, javascript: hata diye jate hain).
export function SvgPreview({ svg, name, size, color }: Props) {
  return (
    <div
      role="img"
      aria-label={name}
      className="[&>svg]:block [&>svg]:size-full"
      style={{ width: size, height: size, color }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}